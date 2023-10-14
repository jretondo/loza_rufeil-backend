import ClientPermission from "../../../models/ClientsPermissions"

export const getClientsPermissions = async (clientId: number) => {
    return await ClientPermission.findAll({
        where: {
            client_id: clientId,
            active: true
        }
    })
}