import { IAccountCharts } from "interfaces/Tables"

export class accountControl {
    last
    count
    constructor() {
        this.last = {
            genre: 0,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
        this.count = {
            genre: 0,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }

    lastGenre(newLastGenre: number) {
        this.last = {
            genre: newLastGenre,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    lastGroup(newLastGroup: number) {
        this.last = {
            genre: this.last.genre,
            group: newLastGroup,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    lastCaption(newLastCaption: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: newLastCaption,
            account: 0,
            subAccount: 0
        }
    }
    lastAccount(newLastAccount: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: this.last.caption,
            account: newLastAccount,
            subAccount: 0
        }
    }
    lastSubAccount(newLastSubAccount: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: this.last.caption,
            account: this.last.account,
            subAccount: newLastSubAccount
        }
    }

    addCountGenre() {
        this.count = {
            genre: this.count.genre + 1,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    addCountGroup() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group + 1,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    addCountCaption() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption + 1,
            account: 0,
            subAccount: 0
        }
    }
    addCountAccount() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption,
            account: this.count.account + 1,
            subAccount: 0
        }
    }
    addCountSubAccount() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption,
            account: this.count.account,
            subAccount: this.count.subAccount + 1
        }
    }
    isPrincipal(account: IAccountCharts) {
        if (account.genre > 0 &&
            account.group === 0 &&
            account.caption === 0 &&
            account.account === 0 &&
            account.sub_account === 0
        ) {
            return true
        }
        return false
    }
    get data() {
        return {
            last: this.last,
            count: this.count
        }
    }
}