import moment from 'moment';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

export const pdfGenerator = async (dataRequest: {
  data: any;
  fileName: string;
  layoutPath: string;
  format: {
    landscape: boolean;
    format: 'legal' | 'letter' | 'A4';
    scale: number;
    displayHeaderFooter: boolean;
    marginBottom: string;
    marginTop: string;
    headerTemplate?: string;
    footerTemplate?: string;
  };
}): Promise<{
  pdfAddress: string;
  fileName: string;
}> => {
  const { data, fileName, layoutPath, format } = dataRequest;
  const uniqueSuffix = moment().format('YYYYMMDDHHmmss');
  const pdfAddress = path.join(
    'public',
    'reports',
    'excel',
    `${uniqueSuffix}-${fileName}.pdf`,
  );

  let browser;

  try {
    // Preparo datos
    const logo = fs.readFileSync(path.join('public', 'images', 'logo.png'));
    const estilo = fs.readFileSync(
      path.join('views', 'reports', 'purchasesList', 'styles.css'),
      'utf8',
    );

    const datos = {
      ...data,
      logo: `data:image/png;base64,${Buffer.from(logo).toString('base64')}`,
      style: `<style>${estilo}</style>`,
    };

    // Render HTML con await (sin callback)
    const html: string = await ejs.renderFile(layoutPath, datos);

    // Lanzar browser con configuración docker-friendly
    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote',
        '--disable-software-rasterizer',
        '--disable-accelerated-2d-canvas',
      ],
    });

    const page = await browser.newPage();

    // Evitar timeouts
    await page.setDefaultTimeout(0);
    await page.setDefaultNavigationTimeout(0);

    // Cargar HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generar PDF con timeout manual
    await Promise.race([
      page.pdf({ path: pdfAddress, ...format }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF TIMEOUT')), 60000),
      ),
    ]);

    return {
      pdfAddress,
      fileName,
    };
  } catch (err) {
    console.error('PDF ERROR:', err);
    throw err;
  } finally {
    // Esto evita el 100% CPU
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};
