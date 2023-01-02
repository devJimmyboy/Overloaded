import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import MainWindow from './MainWindow'
import store from './store'
import { OverlayOptions } from './Overlay'
import AutoUpdater from './AutoUpdater'
import AutoLaunch from 'auto-launch'
import { UpdateInfo } from 'electron-updater'

process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')
if (url) {
  //@ts-ignore
  import('source-map-support/register.js').then(() => console.log('Source map support enabled'))
}
let mainWindow: MainWindow | null = null
let updater: AutoUpdater | null = null
app.whenReady().then(() => {
  if (!process.env.VITE_DEV_SERVER_URL) {
    updater = new AutoUpdater()
  }
  mainWindow = new MainWindow()
})

// app.on('second-instance', () => {
//   if (win) {
//     // Focus on the main window if the user tried to open another
//     if (win.isMinimized()) win.restore()
//     win.focus()
//   }
// })

// app.on('activate', () => {
//   const allWindows = BrowserWindow.getAllWindows()
//   if (allWindows.length) {
//     allWindows[0].focus()
//   }
// })

let autoLauncher: AutoLaunch | null = null
if (app.isPackaged && !process.env.VITE_DEV_SERVER_URL) {
  autoLauncher = new AutoLaunch({
    name: app.name,
    path: app.getPath('exe'),
  })
  autoLauncher.isEnabled().then((enabled) => {
    if (!enabled) {
      autoLauncher.enable()
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

ipcMain.handle('new-overlay', (_, arg: OverlayOptions) => {
  return mainWindow?.newOverlay(arg)
})

ipcMain.handle('update-overlay', (_, arg: OverlayOptions) => {
  return mainWindow?.editOverlay(arg.name, arg)
})
ipcMain.handle('toggle-overlay', (_, arg: string) => {
  const ovrly = mainWindow?.overlays.find((o) => o.name.toLowerCase() === arg.toLowerCase())
  if (ovrly) {
    ovrly.toggleShow()
  }
})

ipcMain.handle('get-overlays', (event) => {
  return store.get('overlays')
})

ipcMain.handle('move-overlay', (_, arg: string) => {
  const ovrly = mainWindow?.overlays.find((o) => o.name.toLowerCase() === arg.toLowerCase())
  if (ovrly) {
    ovrly.toggleEditing()
  }
})

ipcMain.handle('get-version', (_) => {
  return app.getVersion()
})

ipcMain.handle('manual-update', (_) => {
  if (updater) {
    return updater.manualCheckForUpdates(BrowserWindow.fromWebContents(_.sender))
  } else {
    return Promise.resolve({
      version: app.getVersion(),
      releaseDate: new Date().toISOString(),
      releaseName: 'Development',
      files: [],
    } as UpdateInfo)
  }
})
ipcMain.handle('update-now', (_) => {
  if (updater) {
    return updater.downloadUpdate()
  }
})
