export const passCreator = async (): Promise<any> => {
    const longChain = "QWERTYUIOPASDFGHJKLZXCVBNM12345678909876543210mnbvcxzlkjhgfdsapoiuytrewq"
    let random = 0

    const nvaPass = new Promise((resolve, reject) => {
        let pass = ""
        while (pass.length < 10) {
            random = Math.round(Math.random() * 72)
            pass = pass + longChain.substring(random, (random + 1))
        }
        resolve(pass);
    });

    return (nvaPass);
}