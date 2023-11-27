import { Tables } from '../constant/TABLES';
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize2 from '../database/db2';


interface IProviderComprobantes {
    id: number,
    Cuit: number,
    Razon: string,
    IIBB: string,
}

type ProviderComprobantesCreationAttributes = Optional<IProviderComprobantes, 'id'>;

class ProviderComprobantes extends Model<IProviderComprobantes, ProviderComprobantesCreationAttributes> { }

ProviderComprobantes.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Cuit: {
        type: DataTypes.NUMBER
    },
    Razon: {
        type: DataTypes.STRING
    },
    IIBB: {
        type: DataTypes.STRING
    }
}, {
    sequelize: sequelize2,
    tableName: "proveedores_db",
    timestamps: false
})

export = ProviderComprobantes