import path from 'path';

export const FILES_ADDRESS = {
    certAfip: path.join(__dirname, "..", "..", "public", "afip", "certs"),
    csrAfip: path.join(__dirname, "..", "..", "public", "afip", "csr"),
    tokenAfip: path.join(__dirname, "..", "..", "public", "afip", "token"),
    css: path.join(__dirname, "..", "..", "public", "css"),
    images: path.join(__dirname, "..", "..", "public", "images"),
    reportsPdf: path.join(__dirname, "..", "..", "public", "reports", "pdf"),
    reportsExcel: path.join(__dirname, "..", "..", "public", "reports", "excel"),
}