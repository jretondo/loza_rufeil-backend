const getPages = async (rowQuantity: number, rowQuantityPerPage: number, pageActive: number) => {
    let lastPage = 1
    let quantityPages: Array<number> = []

    if (rowQuantity === 0) {
        return {
            cantTotal: 0,
            totalPag: 0
        }
    } else {
        if (rowQuantity < rowQuantityPerPage) {
            quantityPages.push(1)
            return {
                quantityPages: quantityPages,
                lastPage: lastPage
            }
        } else {
            return new Promise((resolve, reject) => {
                const pagesFloat = rowQuantity / rowQuantityPerPage
                const pagesInt: number = Math.round(rowQuantity / rowQuantityPerPage)
                let totalPag
                if (pagesFloat > pagesInt) {
                    totalPag = pagesInt + 1
                } else {
                    if (pagesInt === 0) {
                        totalPag = 1
                    } else {
                        totalPag = pagesInt
                    }
                }

                lastPage = totalPag

                for (let i = 0; i < totalPag; i++) {
                    const PAGES_LIST = i + 1
                    const LOW_LIMIT = (pageActive) - 3
                    const TOP_LIMIT = (pageActive) + 3
                    if (PAGES_LIST > LOW_LIMIT && PAGES_LIST < TOP_LIMIT)
                        quantityPages.push(PAGES_LIST)
                }
                resolve({
                    quantityPages: quantityPages,
                    lastPage: lastPage
                })
            })
        }
    }
}

export = getPages