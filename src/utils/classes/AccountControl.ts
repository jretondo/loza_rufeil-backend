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

    public lastGenre(newLastGenre: number) {
        this.last = {
            genre: newLastGenre,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    public lastGroup(newLastGroup: number) {
        this.last = {
            genre: this.last.genre,
            group: newLastGroup,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    public lastCaption(newLastCaption: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: newLastCaption,
            account: 0,
            subAccount: 0
        }
    }
    public lastAccount(newLastAccount: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: this.last.caption,
            account: newLastAccount,
            subAccount: 0
        }
    }
    public lastSubAccount(newLastSubAccount: number) {
        this.last = {
            genre: this.last.genre,
            group: this.last.group,
            caption: this.last.caption,
            account: this.last.account,
            subAccount: newLastSubAccount
        }
    }

    public addCountGenre() {
        this.count = {
            genre: this.count.genre + 1,
            group: 0,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    public addCountGroup() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group + 1,
            caption: 0,
            account: 0,
            subAccount: 0
        }
    }
    public addCountCaption() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption + 1,
            account: 0,
            subAccount: 0
        }
    }
    public addCountAccount() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption,
            account: this.count.account + 1,
            subAccount: 0
        }
    }
    public addCountSubAccount() {
        this.count = {
            genre: this.count.genre,
            group: this.count.group,
            caption: this.count.caption,
            account: this.count.account,
            subAccount: this.count.subAccount + 1
        }
    }
    get data() {
        return {
            last: this.last,
            count: this.count
        }
    }

}