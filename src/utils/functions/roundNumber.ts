const roundNumber = (number: number, precision = 2) => {
    const factor = Math.pow(10, precision)
    const tempNumber = number * factor
    const roundedTempNumber = Math.round(tempNumber)
    return roundedTempNumber / factor
}

export default roundNumber