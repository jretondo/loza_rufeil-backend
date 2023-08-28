import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Admin from './Admin';
import { IAuth } from '../interfaces/Tables';

type IAuthCreationAttributes = Optional<IAuth, 'id'>;

class AuthAdmin extends Model<IAuth, IAuthCreationAttributes> { }

AuthAdmin.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    user: {
        type: DataTypes.STRING(100)
    },
    pass: {
        type: DataTypes.STRING(250)
    },
    prov: {
        type: DataTypes.BOOLEAN
    },
    admin_id: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.AUTH_ADMIN,
    timestamps: false
})

export = AuthAdmin