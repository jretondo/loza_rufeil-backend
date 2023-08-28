import { IAfipCrt } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Columns, Tables } from '../constant/TABLES';

type AfipCrtCreationAttributes = Optional<IAfipCrt, 'id'>;

class AfipCrt extends Model<IAfipCrt, AfipCrtCreationAttributes> { }

AfipCrt.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    document_number: {
        type: DataTypes.STRING
    },
    business_name: {
        type: DataTypes.STRING
    },
    crt_file: {
        type: DataTypes.STRING
    },
    key_file: {
        type: DataTypes.STRING
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    crt_name: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    tableName: Tables.AFIP_CRT,
    timestamps: false
})

export = AfipCrt