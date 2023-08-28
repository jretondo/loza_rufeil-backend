import fs from 'fs';
import path from 'path';
import { Error } from 'tinify/lib/tinify/Error';
import ejs from 'ejs';
import moment from 'moment';
import { zfill } from '../functions/fillZeros';
import { formatMoney } from '../functions/formatMoney';
import pdf from 'html-pdf';

export const createPDFPayment = async (
    paymentData: any,
    detailsData: Array<any>,
    providerData: any
) => {
    let dataPDF: {
        fileName: string,
        filePath: string
    } = {
        fileName: "",
        filePath: ""
    }
    dataPDF = await new Promise(async (resolve, reject) => {
        function base64_encode(file: any) {
            // read binary data
            var bitmap: Buffer = fs.readFileSync(file);
            // convert binary data to base64 encoded string
            return Buffer.from(bitmap).toString('base64');
        }

        const myCss = fs.readFileSync(path.join("public", "css", "style.css"), 'utf8')
        let logo64 = base64_encode(path.join("public", "images", "logo_long.png"))

        let periods: Array<string> = []

        await new Promise((resolve, reject) => {
            detailsData.map((period, key) => {
                switch (Number(period.month)) {
                    case 1:
                        periods.push("Enero/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 2:
                        periods.push("Febrero/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 3:
                        periods.push("Marzo/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 4:
                        periods.push("Abril/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 5:
                        periods.push("Mayo/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 6:
                        periods.push("Junio/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 7:
                        periods.push("julio/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 8:
                        periods.push("Agosto/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 9:
                        periods.push("Septiembre/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 10:
                        periods.push("Octubre/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 11:
                        periods.push("Noviembre/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    case 12:
                        periods.push("Diciembre/" + period.year + " -  $ " + formatMoney(period.amount))
                        break;
                    default:
                        periods.push("")
                        break;
                }
                if (key === detailsData.length - 1) {
                    resolve("")
                }
            })
        })

        const pvStr = zfill(paymentData.pv, 5)
        const numberStr = zfill(paymentData.number, 8)

        const dataIn = {
            myCss: `<style>${myCss}</style>`,
            date: moment(paymentData.date).format("DD/MM/YYYY"),
            paymentNumber: `${pvStr} - ${numberStr}`,
            providerName: providerData.name,
            dni: providerData.dni,
            type: Number(paymentData.advance) === 1 ? "ADELANTO" : "PAGO POR TRABAJOS",
            periods: periods,
            amount: formatMoney(paymentData.total),
            details: paymentData.details,
            logo: 'data:image/png;base64,' + logo64,
            title: Number(paymentData.advance) === 1 ? "VALE DE ADELANTO" : "PAGO POR TRABAJOS",
        }

        ejs.renderFile(path.join("views", "reports", "payments", "Advance.ejs"), dataIn, (err, data) => {
            if (err) {
                console.log('err', err);
                throw new Error("Algo salio mal")
            }


            const fileName = `${pvStr} - ${numberStr}.pdf`
            const filePath = path.join("public", "reports", fileName)

            let options = {
                "height": "12in",
                "width": "16.5in",
                "border": {
                    "right": "0cm",
                    "left": "0cm"
                },
            };

            pdf.create(data, options).toFile(filePath, async function (err, data) {
                if (err) {
                    console.log('err', err);
                    throw new Error("Algo salio mal")
                }
                resolve({
                    fileName,
                    filePath
                })
            });
        })
    })

    return dataPDF
}