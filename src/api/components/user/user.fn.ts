import AdminPermission from "../../../models/AdminPermission"
import { Op } from "sequelize"

export const userPermissions = async (userId: number, clientId: number, minPermissionGrade: number) => {
    return AdminPermission.findAll({
        where: [
            { user_id: userId },
            { client_id: clientId },
            { permission_grade_id: { [Op.gte]: minPermissionGrade } }
        ]
    })
}