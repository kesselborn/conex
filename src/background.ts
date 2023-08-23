export class Cache {
    _actionPopup: HTMLElement | null

    constructor() {
        this._actionPopup = null
    }

    set actionPopup(e: HTMLElement | null) {
        this._actionPopup = e
    }

    get actionPopup(): HTMLElement | null {
        return this._actionPopup
    }
}

// @ts-ignore
window.Cache = new Cache()