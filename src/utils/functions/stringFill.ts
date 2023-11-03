export function stringFill(str: string, width: number, char: string = "0", left: boolean = true) {

    let strOutput = str; /* Valor absoluto del número */
    let length = String(str).length; /* Largo del número */

    if (width <= length) {
        return String(strOutput).slice(0, width);
    } else {
        if (left) {
            while (width > strOutput.length) {
                strOutput = char + strOutput;
            }
            return strOutput
        } else {
            while (width > strOutput.length) {
                strOutput = strOutput + char;
            }
            return strOutput
        }
    }
}