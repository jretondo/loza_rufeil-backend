import { Request } from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadFile = (folderDest: string, fields?: Array<string>) => {
    if (!fs.existsSync(folderDest)) {
        fs.mkdirSync(folderDest);
    }
    const storage = multer.diskStorage({
        destination: folderDest,
        filename: (req: Request, file: any, cb: any) => {
            if (!req.body.filesName) {
                req.body.filesName = [];
            }
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            req.body.filesName.push({
                fieldName: file.fieldname,
                path: path.join(`${uniqueSuffix}-${file.originalname}`)
            })
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    })
    let upload;

    if (fields) {
        const arrayFields: Array<any> = fields.map(item => {
            return { name: item }
        })
        upload = multer({
            storage,
        }).fields(arrayFields);
    } else {
        upload = multer({
            storage,
        }).any();
    }

    return upload
}

export = uploadFile