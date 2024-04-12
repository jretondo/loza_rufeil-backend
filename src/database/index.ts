import { config } from '../config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    config.mysql.database,
    config.mysql.user,
    config.mysql.password,
    {
        host: config.mysql.host,
        dialect: 'mysql',
        logging: true
    });

export = sequelize