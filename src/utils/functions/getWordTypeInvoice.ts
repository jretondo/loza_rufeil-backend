export function invoiceTypeConvertObject(invoiceType: number) {
    switch (invoiceType) {
        case 1:
            return {
                type: { id: 1, name: "Factura" },
                word: "A"
            };
        case 2:
            return {
                type: { id: 5, name: "Nota de débito" },
                word: "A"
            };
        case 3:
            return {
                type: { id: 4, name: "Nota de crédito" },
                word: "A"
            };
        case 4:
            return {
                type: { id: 2, name: "Recibo" },
                word: "A"
            }
        case 6:
            return {
                type: { id: 1, name: "Factura" },
                word: "B"
            };
        case 7:
            return {
                type: { id: 5, name: "Nota de débito" },
                word: "B"
            };
        case 8:
            return {
                type: { id: 4, name: "Nota de crédito" },
                word: "B"
            };
        case 9:
            return {
                type: { id: 2, name: "Recibo" },
                word: "B"
            };
        case 11:
            return {
                type: { id: 1, name: "Factura" },
                word: "C"
            };
        case 12:
            return {
                type: { id: 5, name: "Nota de débito" },
                word: "C"
            };
        case 13:
            return {
                type: { id: 4, name: "Nota de crédito" },
                word: "C"
            };
        case 15:
            return {
                type: { id: 2, name: "Recibo" },
                word: "C"
            };
        case 51:
            return {
                type: { id: 1, name: "Factura" },
                word: "M"
            };
        case 52:
            return {
                type: { id: 5, name: "Nota de débito" },
                word: "M"
            };
        case 53:
            return {
                type: { id: 4, name: "Nota de crédito" },
                word: "M"
            };
        case 54:
            return {
                type: { id: 2, name: "Recibo" },
                word: "M"
            };
        case 81:
            return {
                type: { id: 3, name: "Ticket" },
                word: "A"
            };
        case 82:
            return {
                type: { id: 3, name: "Ticket" },
                word: "B"
            };
        case 83:
            return {
                type: { id: 3, name: "Ticket" },
                word: "B"
            };
        case 109:
            return {
                type: { id: 3, name: "Ticket" },
                word: "C"
            };
        default:
            return {
                type: { id: 1, name: "Factura" },
                word: "B"
            };
    }
}