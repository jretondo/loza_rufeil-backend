import { Columns, Tables } from '../constant/TABLES';
import { Restrictions } from '../constant/OTHERS';
import { DataTypes, Optional, Model } from 'sequelize';
import sequelize from '../database';
import { IActivity } from '../interfaces/Tables';
import Admin from './Admin';

type ActivityCreationAttributes = Optional<IActivity, 'id'>;

class Activity extends Model<IActivity, ActivityCreationAttributes> { }

Activity.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    activity_description: {
        type: DataTypes.TEXT("long")
    }
}, {
    sequelize,
    tableName: Tables.ACTIVITY,
    timestamps: false
})

Admin.hasMany(Activity, {
    foreignKey: Columns.activity.user_id,
    sourceKey: Columns.admin.id,
    onDelete: Restrictions.CASCADE,
    onUpdate: Restrictions.CASCADE
})

Activity.belongsTo(Admin, {
    foreignKey: Columns.activity.user_id,
    targetKey: Columns.admin.id
})

export = Activity