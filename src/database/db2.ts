import { config } from '../config';
import { Sequelize } from 'sequelize';

const sequelize2 = new Sequelize(
    "comprobantes",
    config.mysql.user,
    config.mysql.password,
    {
        host: config.mysql.host,
        dialect: 'mysql',
        logging: false
    });

export = sequelize2