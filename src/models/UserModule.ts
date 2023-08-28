import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { IUserModules } from '../interfaces/Tables';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import Module from './Module';
import Admin from './Admin';

type UserModulesCreationAttributes = Optional<IUserModules, 'id'>;

class UserModules extends Model<IUserModules, UserModulesCreationAttributes> { }

UserModules.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    module_id: {
        type: DataTypes.INTEGER
    },
    permission_grade: {
        type: DataTypes.INTEGER
    }
}, {
    sequelize,
    tableName: Tables.USER_MODULES,
    timestamps: false
})

Module.hasMany(UserModules, {
    foreignKey: Columns.userModules.module_id,
    sourceKey: Columns.modules.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

UserModules.belongsTo(Module, {
    foreignKey: Columns.userModules.module_id,
    targetKey: Columns.modules.id,
})

Admin.hasMany(UserModules, {
    foreignKey: Columns.userModules.user_id,
    sourceKey: Columns.admin.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

UserModules.belongsTo(Admin, {
    foreignKey: Columns.userModules.user_id,
    targetKey: Columns.admin.id,
})

export = UserModules