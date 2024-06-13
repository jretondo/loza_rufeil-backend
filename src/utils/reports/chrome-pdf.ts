import moment from "moment"
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

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

        await ejs.renderFile(layoutPath, datos, async (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath:
                  process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
              });
      
              const page = await browser.newPage();
              await page.setContent(data, {
                waitUntil: 'networkidle0',
              });
      
              await page.pdf({
                path: pdfAddress,
                ...format
              });
              await browser.close();
      
              const dataFact = {
                pdfAddress: pdfAddress,
                fileName: fileName,
              };
      
            return resolve(dataFact);   
        })
    })
}