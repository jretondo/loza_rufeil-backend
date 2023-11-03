import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import compressing from 'compressing';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { Op } from 'sequelize';
import { IAfipCrt } from '../../../interfaces/Tables';
import AfipCrt from '../../../models/AfipCrt';
import { FILES_ADDRESS } from '../../../constant/FILES_ADDRESS';
import { file, success } from '../../../network/response';

export const upsert = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        certDataIn: {
            filesName: Array<{ fieldName: string, path: string }>,
            document_number: string,
            business_name: string,
            crt_name: string,
            id?: number
        }
    ) {
        const certData: IAfipCrt = {
            business_name: certDataIn.business_name,
            document_number: certDataIn.document_number,
            crt_file: certDataIn.filesName && certDataIn.filesName.filter(file => file.fieldName === "crt_file")[0].path,
            key_file: certDataIn.filesName && certDataIn.filesName.filter(file => file.fieldName === "key_file")[0].path,
            crt_name: certDataIn.crt_name,
            id: certDataIn.id
        }
        if (certData.id) {
            if (certDataIn.filesName) {
                const oldData = await AfipCrt.findOne({ where: { id: certData.id } })
                const fileCert = path.join(FILES_ADDRESS.certAfip, oldData?.dataValues.crt_file || "");
                const fileKey = path.join(FILES_ADDRESS.certAfip, oldData?.dataValues.key_file || "");
                try {
                    fs.unlinkSync(fileCert);
                    fs.unlinkSync(fileKey);
                } catch (error) {
                    console.error("No se pudieron eliminar los certificados anteriores.")
                    console.error("Limpiar el archivo: " + fileCert + " y el archivo: " + fileKey)
                }
            }
            return await AfipCrt.update(certData, { where: { id: certData.id } })
        } else {
            return await AfipCrt.create(certData)
        }
    })(req.body).then(data => success({ req, res, message: data })).catch(next)
}

export const list = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        page: number,
        query?: string
    ) {
        const ITEMS_PER_PAGE = 10;

        const offset = ((page || 1) - 1) * (ITEMS_PER_PAGE);
        const { count, rows } = await AfipCrt.findAndCountAll({
            where: {
                [Op.or]: [
                    { business_name: { [Op.substring]: query } },
                    { document_number: { [Op.substring]: query } }
                ]
            },
            offset: offset,
            limit: ITEMS_PER_PAGE
        });
        return {
            totalItems: count,
            itemsPerPage: ITEMS_PER_PAGE,
            items: rows
        }
    })(
        Number(req.params.page),
        String(req.query.query || "")
    ).then(data => success({ req, res, message: data })).catch(next)
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
    (async function (idCert: number) {

        const oldData = await AfipCrt.findOne({ where: { id: idCert } })
        const response = await AfipCrt.destroy({ where: { id: idCert } })
        const fileCert = path.join(FILES_ADDRESS.certAfip, oldData?.dataValues.crt_file || "");
        const fileKey = path.join(FILES_ADDRESS.certAfip, oldData?.dataValues.key_file || "");
        if (response > 0) {
            try {
                fs.unlinkSync(fileCert);
                fs.unlinkSync(fileKey);
            } catch (error) {
                console.error("No se pudieron eliminar los certificados anteriores.")
                console.error("Limpiar el archivo: " + fileCert + " y el archivo: " + fileKey)
            }
            return response;
        } else {
            throw Error("No se pudo eliminar el certificado!")
        }
    })(Number(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}

export const generateCsr = async (req: Request, res: Response, next: NextFunction) => {
    (async function (
        cuit: string,
        businessName: string,
        certificateName: string
    ) {
        const firstCommand = `openssl genrsa -out ${businessName.replace(new RegExp(" ", 'g'), "_")}.key 2048`
        const secondCommand = `openssl req -new -key ${businessName.replace(new RegExp(" ", 'g'), "_")}.key -subj "/C=AR/O=${businessName}/CN=${certificateName.replace(new RegExp(" ", 'g'), "_")}/serialNumber=CUIT ${cuit}" -out ${businessName.replace(new RegExp(" ", 'g'), "_")}.csr`

        try {
            execSync(`mkdir ${cuit}`, { cwd: FILES_ADDRESS.csrAfip })
        } catch (error) {
        }
        try {
            execSync(firstCommand, { cwd: path.join(FILES_ADDRESS.csrAfip, cuit) })
            execSync(secondCommand, { cwd: path.join(FILES_ADDRESS.csrAfip, cuit) })
        } catch (error) {
            console.error(error)
            throw Error("No se pudo generar la solicitus de certificado y tampoco la llave privada.")
        }
        return await compressing.tar.compressDir(path.join(FILES_ADDRESS.csrAfip, cuit), path.join(FILES_ADDRESS.csrAfip, cuit + ".tar")).then(() => {

            setTimeout(() => {
                fs.unlinkSync(path.join(FILES_ADDRESS.csrAfip, cuit + ".tar"));
                fs.rmdirSync(path.join(FILES_ADDRESS.csrAfip, cuit), { recursive: true });
            }, 5000);

            return {
                filePath: path.join(FILES_ADDRESS.csrAfip, cuit + ".tar"),
                fileName: cuit + ".tar"
            }
        }).catch((error) => {
            console.error(error)
            throw Error("No se pudo generar la solicitus de certificado y tampoco la llave privada.")
        })
    })(req.body.cuit, req.body.businessName, req.body.certificateName).then(data => file(req, res, data.filePath, "application/x-gzip", data.fileName)).catch(next)
}

export const updateAttribute = async (req: Request, res: Response, next: NextFunction) => {
    (async function (id: number, field: IAfipCrt) {
        const response = await AfipCrt.update(field, { where: { id: id } })
        if (response[0] > 0) {
            if (field.enabled) {
                let others = field
                others.enabled = !field.enabled
                await AfipCrt.update(others, { where: { id: { [Op.not]: id } } })
            }
        }

        return response
    })(req.body.id, req.body.field).then(data => success({ req, res, message: data })).catch(next)
}

export const downloadCertificate = async (req: Request, res: Response, next: NextFunction) => {
    (async function (id: number) {
        const certData = await AfipCrt.findOne({ where: { id: id } });
        const fileCert = path.join(FILES_ADDRESS.certAfip, certData?.dataValues.crt_file || "");
        const fileKey = path.join(FILES_ADDRESS.certAfip, certData?.dataValues.key_file || "");
        const tarStream = new compressing.tar.Stream();
        tarStream.addEntry(fileCert);
        tarStream.addEntry(fileKey);
        const destStream = fs.createWriteStream(path.join(FILES_ADDRESS.certAfip, (certData?.dataValues.document_number + ".tar" || "")))
        const pipelineAsync = promisify(pipeline);
        const response = async () => {
            try {
                await pipelineAsync(
                    tarStream,
                    destStream
                );

                setTimeout(() => {
                    fs.unlinkSync(path.join(FILES_ADDRESS.certAfip, certData?.dataValues.document_number + ".tar" || ""));
                }, 5000);

                return {
                    filePath: path.join(FILES_ADDRESS.certAfip, certData?.dataValues.document_number + ".tar" || ""),
                    fileName: certData?.dataValues.document_number + ".tar" || ""
                }
            } catch (error) {
                console.error(error)
                throw Error("No se pudo generar la solicitus de certificado y tampoco la llave privada.")
            }
        }
        return response()
    })(parseInt(req.params.id)).then(data => success({ req, res, message: data })).catch(next)
}