import moment from "moment"
import path from 'path';
import fs from 'fs';
import JsReport from "jsreport-core";
import { promisify } from "util";
import ejs from 'ejs';

export const pdfGenerator = async (dataRequest: {
    data: any,
    fileName: string,
    layoutPath: string,
    format: {
        landscape: boolean,
        format: "legal" | "letter" | "A4",
        scale: number,
        displayHeaderFooter: boolean,
        marginBottom: string,
        marginTop: string,
        headerTemplate?: string,
        footerTemplate?: string,
    }
}): Promise<{
    pdfAddress: string,
    fileName: string
}> => {
    const { data, fileName, layoutPath, format } = dataRequest

    const uniqueSuffix = moment().format("YYYYMMDDHHmmss")
    const pdfAddress = path.join("public", "reports", "excel", uniqueSuffix + `-${fileName}.pfd`)
    return new Promise(async (resolve, reject) => {
        //const productos = await productController.pricesProd()

        function base64_encode(file: any) {
            // read binary data
            var bitmap: Buffer = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return Buffer.from(bitmap).toString('base64');
        }

        const logo = base64_encode(path.join("public", "images", "logo.png"))
        const estilo = fs.readFileSync(path.join("views", "reports", "purchasesList", "styles.css"), 'utf8')

        const datos = {
            ...data,
            logo: 'data:image/png;base64,' + logo,
            style: "<style>" + estilo + "</style>",
        }

        const jsreport = JsReport({
            extensions: {
                "chrome-pdf": {
                    "launchOptions": {
                        "args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
                        executablePath: "/usr/bin/chromium-browser"
                    }
                }
            }
        });

        jsreport.use(require('jsreport-chrome-pdf')())

        const writeFileAsync = promisify(fs.writeFile)
        await ejs.renderFile(layoutPath, datos, async (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }

            await jsreport.init()

            jsreport.render({
                template: {
                    content: data,
                    name: 'lista',
                    engine: 'none',
                    recipe: 'chrome-pdf',
                    chrome: format,
                },
            })
                .then(async (out) => {
                    await writeFileAsync(pdfAddress, out.content)
                    await jsreport.close()
                    const dataFact = {
                        pdfAddress,
                        fileName: uniqueSuffix + `-${fileName}.pdf`
                    }
                    resolve(dataFact)
                })
                .catch((e) => {
                    reject(e)
                });
        })
    })
}