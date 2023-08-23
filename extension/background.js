export class Cache {
  constructor() {
    this._actionPopup = null;
  }

  set actionPopup(e) {
    this._actionPopup = e;
  }

  get actionPopup() {
    return this._actionPopup;
  }
}
// @ts-ignore
window.Cache = new Cache();
