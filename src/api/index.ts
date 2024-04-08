import { App } from './app';
import { config } from '../config';
import sequelize from '../database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, "..", "..", '.env') });


const handleConn = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Connection has been established successfully. DB: ', config.mysql.database);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

const main = () => {
    const app = new App(config.api.port);
    if (process.env.MACHINE === "LOCAL") {
        handleConn()
        app.listenTest();
    } else {
        handleConn()
        app.listenProd();
    }
}

main();