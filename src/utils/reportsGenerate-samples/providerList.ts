import fs from 'fs';
import path from 'path';
import { Error } from 'tinify/lib/tinify/Error';
import ejs from 'ejs';
import JsReport from 'jsreport-core';
import { promisify } from 'util';

export const createProviderListPDF = async (
    providerList: Array<any>
) => {
    return new Promise(async (resolve, reject) => {
        function base64_encode(file: any) {
            // read binary data
            var bitmap: Buffer = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return Buffer.from(bitmap).toString('base64');
        }

        const style = fs.readFileSync(path.join("views", "reports", "provList", "styles.css"), 'utf8')
        const logo = base64_encode(path.join("public", "images", "logo.png"))

        const dateNow = new Date().getTime()

        const fileName = `provList-${dateNow}.pdf`
        const location = path.join("public", "reports", "provider-list", fileName)

        const data = {
            logo: 'data:image/png;base64,' + logo,
            style: "<style>" + style + "</style>",
            providerList: providerList
        }

        const jsReport = JsReport({
            extensions: {
                "chrome-pdf": {
                    "launchOptions": {
                        "args": ["--no-sandbox"]
                    }
                }
            }
        })

        jsReport.use(require('jsreport-chrome-pdf')())

        const writeFileAsync = promisify(fs.writeFile)

        await ejs.renderFile(path.join("views", "reports", "provList", "index.ejs"), data, async (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }

            await jsReport.init()
            jsReport.render({
                template: {
                    content: data,
                    name: 'lista',
                    engine: 'none',
                    recipe: 'chrome-pdf',
                    chrome: {
                        "landscape": true,
                        "format": "A4",
                        "scale": 0.8,
                        displayHeaderFooter: true,
                        marginBottom: "2cm",
                        footerTemplate: "<div style='font-size: 14px;text-align: center;width: 100%;'>Página&nbsp;<span class='pageNumber'></span>&nbsp;de&nbsp;<span class='totalPages'></span></div>",
                        marginTop: "0.5cm",
                        headerTemplate: ""
                    },

                },
            })
                .then(async (out) => {
                    await writeFileAsync(location, out.content)
                    await jsReport.close()
                    const dataFact = {
                        filePath: location,
                        fileName: fileName
                    }
                    resolve(dataFact)
                })
                .catch((e) => {
                    reject(e)
                });
        })
    })
}