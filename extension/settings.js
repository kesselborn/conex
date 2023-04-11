export async function readSettings() {
    return (await browser.storage.local.get('settings'));
}
export async function writeSettings(settings) {
    return await browser.storage.local.set({ settings: settings });
}
