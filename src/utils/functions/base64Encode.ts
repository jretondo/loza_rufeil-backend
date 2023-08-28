import fs from 'fs';
export function base64Encode(file: any) {
    // read binary data
    var bitmap: Buffer = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}