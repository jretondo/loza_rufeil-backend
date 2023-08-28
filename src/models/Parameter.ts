import { IParameters } from '../interfaces/Tables';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import { Tables } from '../constant/TABLES';

type ParameterCreationAttributes = Optional<IParameters, 'id'>;

class Parameter extends Model<IParameters, ParameterCreationAttributes> { }

Parameter.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    parameter: {
        type: DataTypes.STRING
    },
    value: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    tableName: Tables.PARAMETERS,
    timestamps: false
})

export = Parameter