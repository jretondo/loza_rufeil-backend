export function monthToStr(monthNumber: number) {
    let monthStr = ""
    switch (monthNumber) {
        case 1:
            monthStr = ("Enero")
            break;
        case 2:
            monthStr = ("Febrero")
            break;
        case 3:
            monthStr = ("Marzo")
            break;
        case 4:
            monthStr = ("Abril")
            break;
        case 5:
            monthStr = ("Mayo")
            break;
        case 6:
            monthStr = ("Junio")
            break;
        case 7:
            monthStr = ("Julio")
            break;
        case 8:
            monthStr = ("Agosto")
            break;
        case 9:
            monthStr = ("Septiembre")
            break;
        case 10:
            monthStr = ("Octubre")
            break;
        case 11:
            monthStr = ("Noviembre")
            break;
        case 12:
            monthStr = ("Diciembre")
            break;

        default:
            break;
    }

    return monthStr
}