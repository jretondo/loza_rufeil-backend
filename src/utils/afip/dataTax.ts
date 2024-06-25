import AfipCrt from '../../models/AfipCrt';
import { AfipClass } from '../classes/AfipClass';
import path from 'path';
import fs from 'fs';
import { base64Encode } from '../functions/base64Encode';
import moment from 'moment';
import JsReport from 'jsreport-core';
import { promisify } from 'util';
import ejs from 'ejs';

export const clientDataTax = async (documentNumber: number) => {
  const enabledCertificate = await AfipCrt.findOne({
    where: { enabled: true },
  });
  const afipObject = new AfipClass(
    Number(enabledCertificate?.dataValues.document_number) || 0,
    enabledCertificate?.dataValues.crt_file || '',
    enabledCertificate?.dataValues.key_file || '',
    true,
  );
  const dataFiscal = await afipObject.getDataCUIT(documentNumber);
  return dataFiscal;
};

export const clientDataTaxPDF = async (
  documentNumber: number,
  isMono: boolean,
) => {
  const data = await clientDataTax(documentNumber);
  let layoutUrl = '';
  isMono
    ? (layoutUrl = path.join('views', 'reports', 'clientTaxData', 'mono.ejs'))
    : (layoutUrl = path.join(
        'views',
        'reports',
        'clientTaxData',
        'general.ejs',
      ));
  const myCss = fs.readFileSync(
    path.join('public', 'css', 'bootstrap.min.css'),
    'utf8',
  );
  const logoAfip = base64Encode(path.join('public', 'images', 'AFIP1.png'));
  const logo = base64Encode(path.join('public', 'images', 'logo_long.png'));
  const dataReport = {
    style: `<style>${myCss}</style>`,
    logo: 'data:image/png;base64,' + logo,
    logoAfip: 'data:image/png;base64,' + logoAfip,
    clientDataTax: data.data,
    date: moment.utc(new Date()).format('DD/MM/YYYY'),
  };
  const jsReport = JsReport({
    extensions: {
      'chrome-pdf': {
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
    },
  });

  jsReport.use(require('jsreport-chrome-pdf')());
  const writeFileAsync = promisify(fs.writeFile);
  const fileName = `TaxProof - ${
    Date.now() + '-' + Math.round(Math.random() * 1e9)
  }.pdf`;
  const location = path.join('public', 'reports', fileName);

  const htmlGenerated = await ejs.renderFile(layoutUrl, dataReport);

  await jsReport.init();
  return jsReport
    .render({
      template: {
        content: htmlGenerated,
        name: 'clientDataTax',
        engine: 'none',
        recipe: 'chrome-pdf',
        chrome: {
          landscape: false,
          format: 'A4',
          scale: 0.8,
          displayHeaderFooter: false,
        },
      },
    })
    .then(async (out) => {
      setTimeout(() => {
        fs.unlinkSync(location);
      }, 5000);
      await writeFileAsync(location, out.content);
      await jsReport.close();
      return {
        filePath: location,
        fileName: fileName,
      };
    })
    .catch((error) => {
      throw Error(error);
    });
};
