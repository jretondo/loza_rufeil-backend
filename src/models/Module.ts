import { IModules } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Tables } from '../constant/TABLES';

type ModuleCreationAttributes = Optional<IModules, 'id'>;

class Module extends Model<IModules, ModuleCreationAttributes> { }

Module.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    module_name: {
        type: DataTypes.STRING(200)
    }
}, {
    sequelize,
    tableName: Tables.MODULES,
    timestamps: false
})

export = Module