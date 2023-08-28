import nodemailer from 'nodemailer';
import { config } from '../../config';

const sendEmail = async (receiver: string, subject: string, msg: string, attachment?: Array<{ filename: string | undefined, path: string | undefined }>) => {
    const transporter = nodemailer.createTransport({
        host: config.sendmail.host,
        port: config.sendmail.port,
        secure: config.sendmail.secure,
        auth: {
            user: config.sendmail.auth.user,
            pass: config.sendmail.auth.pass
        }
    })
    if (attachment) {
        return await transporter.sendMail({
            from: config.sendmail.from,
            to: receiver,
            subject: subject,
            attachments: attachment,
            html: msg
        })
    } else {
        return await transporter.sendMail({
            from: config.sendmail.from,
            to: receiver,
            subject: subject,
            html: msg
        })
    }
}

export = sendEmail