interface IApi {
    port: any
}
interface IJwt {
    secret: any
}
interface IMysql {
    host: any,
    user: any,
    password: any,
    database: any
}
interface authEmail {
    user: any,
    pass: any
}
interface ISendmail {
    host: any,
    port: any,
    secure: any,
    from: any,
    auth: authEmail
}
interface ISsl {
    crt: any,
    key: any
}

interface ITinify {
    key: any
}

interface IConF {
    api: IApi,
    jwt: IJwt,
    mysql: IMysql,
    sendmail: ISendmail,
    ssl: ISsl,
    tinify: ITinify
}

let config: IConF;

if (process.env.ENTORNO === "PROD") {
    config = {
        api: {
            port: process.env.PORT
        },
        jwt: {
            secret: process.env.SECRET
        },
        mysql: {
            host: process.env.HOST_DB,
            user: process.env.USER_DB,
            password: process.env.PASS_DB,
            database: process.env.NAME_DB
        },
        sendmail: {
            host: process.env.HOST_EMAIL,
            port: process.env.PORT_EMAIL,
            secure: true,
            from: process.env.SENDER_EMAIL_INFO,
            auth: {
                user: process.env.SENDER_EMAIL_CONF_INFO,
                pass: process.env.PASS_EMAIL
            }
        },
        ssl: {
            crt: process.env.SSL_CERT_NAME,
            key: process.env.SSL_KEY_NAME
        },
        tinify: {
            key: process.env.TINIFY_KEY
        }
    }
} else {
    config = {
        api: {
            port: process.env.PORT_TEST
        },
        jwt: {
            secret: process.env.SECRET
        },
        mysql: {
            host: process.env.HOST_DB,
            user: process.env.USER_DB,
            password: process.env.PASS_DB,
            database: process.env.NAME_DB_TEST
        },
        sendmail: {
            host: process.env.HOST_EMAIL,
            port: process.env.PORT_EMAIL,
            secure: true,
            from: process.env.SENDER_EMAIL_INFO,
            auth: {
                user: process.env.SENDER_EMAIL_CONF_INFO,
                pass: process.env.PASS_EMAIL
            }
        },
        ssl: {
            crt: process.env.SSL_CERT_NAME,
            key: process.env.SSL_KEY_NAME
        },
        tinify: {
            key: process.env.TINIFY_KEY
        }
    }
}

export {
    config
}