import { IIvaTypes } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Tables } from '../constant/TABLES';

type IvaTypeCreationAttributes = Optional<IIvaTypes, 'id'>;

class IvaType extends Model<IIvaTypes, IvaTypeCreationAttributes> { }

IvaType.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: false,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(20)
    },
    percentage: {
        type: DataTypes.FLOAT
    }
}, {
    sequelize,
    tableName: Tables.IVA_TYPES,
    timestamps: false
})

export = IvaType