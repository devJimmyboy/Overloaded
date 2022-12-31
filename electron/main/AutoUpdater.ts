import type { BrowserWindow } from 'electron'
import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

export default class AutoUpdater {
  constructor() {
    log.transports.file.level = 'debug'
    autoUpdater.logger = log
    this.init()
  }
  async init() {
    if (!process.env.PROD) {
      autoUpdater.autoDownload = false
    }
    autoUpdater.fullChangelog = true
    const result = await autoUpdater.checkForUpdatesAndNotify({
      body: "It'll install in the background and update automatically when you restart the app.\n\nCheck the changelog for more info at https://github.com/devJimmyboy/Overloaded/releases/latest",
      title: `New Update Available for Overloaded!`,
    })
    log.info(result.updateInfo.releaseName, result.updateInfo.version)
  }
  public async manualCheckForUpdates(bWindow: BrowserWindow) {
    const update = await autoUpdater.checkForUpdates()

    if (update?.updateInfo.version !== app.getVersion()) {
      bWindow.webContents.send('update-available', update?.updateInfo)
    }
    return update?.updateInfo
  }

  public async downloadUpdate() {
    return autoUpdater.downloadUpdate()
  }
}
