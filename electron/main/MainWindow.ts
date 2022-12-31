import { BrowserWindow, BrowserWindowConstructorOptions, Menu, Tray, app, shell } from 'electron'
import Positioner from 'electron-positioner'
import { getWindowPosition } from 'menubar'
import EventEmitter from 'node:events'
import path from 'node:path'
import TypedEmitter from 'typed-emitter'
import fs from 'node:fs'
import Overlay, { OverlayOptions } from './Overlay'
import store from './store'

type MessageEvents = {
  activate: () => void
  hide: () => void
  'after-hide': () => void
  show: () => void
  'after-show': () => void
  ready: () => void
  'create-window': () => void
  'focus-lost': () => void
  'before-load': () => void
  'before-overlays': () => void
  'after-create-window': () => void
  'after-close': () => void
}

class MainWindow extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
  private _app: Electron.App
  private _window: BrowserWindow
  private _isVisible: boolean
  private _blurTimeout: NodeJS.Timeout | null = null
  private _cachedBounds?: Electron.Rectangle
  private _positioner?: Positioner
  private _tray?: Tray

  overlays: Overlay[] = []

  windowPosition:
    | 'trayCenter'
    | 'trayBottomCenter'
    | 'trayBottomLeft'
    | 'trayBottomRight'
    | 'trayTopCenter'
    | 'trayTopLeft'
    | 'trayTopRight'
    | 'center'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'topCenter'
    | 'bottomCenter'
    | 'mouse'
    | 'cursor'
    | 'taskbar' = 'trayCenter'
  constructor() {
    super()
    this._app = app

    this._isVisible = false

    if (app.isReady()) {
      process.nextTick(() => this.appReady().catch((err) => console.error('MainWindow: ', err)))
    } else {
      app.on('ready', () => {
        this.appReady().catch((err) => console.error('MainWindow: ', err))
      })
    }
  }

  /**
   * The Electron [App](https://electronjs.org/docs/api/app)
   * instance.
   */
  get app(): Electron.App {
    return this._app
  }

  /**
   * The [electron-positioner](https://github.com/jenslind/electron-positioner)
   * instance.
   */
  get positioner(): Positioner {
    if (!this._positioner) {
      throw new Error('Please access `this.positioner` after the `after-create-window` event has fired.')
    }

    return this._positioner
  }

  /**
   * The Electron [Tray](https://electronjs.org/docs/api/tray) instance.
   */
  get tray(): Tray {
    if (!this._tray) {
      throw new Error('Please access `this.tray` after the `ready` event has fired.')
    }

    return this._tray
  }

  /**
   * The Electron [BrowserWindow](https://electronjs.org/docs/api/browser-window)
   * instance, if it's present.
   */
  get window(): BrowserWindow | undefined {
    return this._window
  }
  /**
   * Hide the menubar window.
   */
  hideWindow(): void {
    if (!this._window || !this._isVisible) {
      return
    }
    this.emit('hide')
    this._window.hide()
    this.emit('after-hide')
    this._isVisible = false
    if (this._blurTimeout) {
      clearTimeout(this._blurTimeout)
      this._blurTimeout = null
    }
  }
  private async appReady(): Promise<void> {
    if (this.app.dock) {
      this.app.dock.hide()
    }

    this.app.on('activate', (_event, hasVisibleWindows) => {
      if (!hasVisibleWindows) {
        this.showWindow().catch(console.error)
      }
    })

    let trayImage = path.join(process.env.PUBLIC, process.platform === 'win32' ? 'favicon.ico' : 'tray.png')
    if (typeof trayImage === 'string' && !fs.existsSync(trayImage)) {
      trayImage = path.join(__dirname, '..', 'assets', process.platform === 'win32' ? 'favicon.ico' : 'tray.png') // Default cat icon
    }

    const defaultClickEvent = 'click'

    this._tray = new Tray(trayImage)
    // Type guards for TS not to complain
    if (!this.tray) {
      throw new Error('Tray has been initialized above')
    }
    this.tray.on(
      defaultClickEvent as Parameters<Tray['on']>[0],
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.clicked.bind(this)
    )
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.tray.on('double-click', this.clicked.bind(this))
    this.tray.setTitle('Overloaded')
    const contextMenu = Menu.buildFromTemplate([{ label: 'Quit Overloaded', type: 'normal', click: () => this.app.quit() }])
    this.tray.setContextMenu(contextMenu)

    this.windowPosition = getWindowPosition(this.tray)

    await this.createWindow()

    this.emit('before-overlays')

    const overlayOptions = store.get('overlays')
    if (overlayOptions) {
      for (const overlayOption of overlayOptions) {
        const overlay = new Overlay(overlayOption)
        this.overlays.push(overlay)
      }
    }
    this.updateTray()

    this.emit('ready')
  }
  /**
   * Show the menubar window.
   *
   * @param trayPos - The bounds to show the window in.
   */
  async showWindow(trayPos?: Electron.Rectangle): Promise<void> {
    if (!this.tray) {
      throw new Error('Tray should have been instantiated by now')
    }

    if (!this._window) {
      await this.createWindow()
    }

    // Use guard for TypeScript, to avoid ! everywhere
    if (!this._window) {
      throw new Error('Window has been initialized just above. qed.')
    }

    // 'Windows' taskbar: sync windows position each time before showing
    // https://github.com/maxogden/menubar/issues/232
    if (['win32', 'linux'].includes(process.platform)) {
      // Fill in this._options.windowPosition when taskbar position is available
      this.windowPosition = getWindowPosition(this.tray)
    }

    this.emit('show')

    if (trayPos && trayPos.x !== 0) {
      // Cache the bounds
      this._cachedBounds = trayPos
    } else if (this._cachedBounds) {
      // Cached value will be used if showWindow is called without bounds data
      trayPos = this._cachedBounds
    } else if (this.tray.getBounds) {
      // Get the current tray bounds
      trayPos = this.tray.getBounds()
    }

    // Default the window to the right if `trayPos` bounds are undefined or null.
    let noBoundsPosition: Positioner.Position = process.platform === 'win32' ? 'bottomRight' : 'topRight'

    const position = this.positioner.calculate(noBoundsPosition, trayPos) as { x: number; y: number }

    // Not using `||` because x and y can be zero.
    const x = position.x
    const y = position.y

    // `.setPosition` crashed on non-integers
    // https://github.com/maxogden/menubar/issues/233
    this._window.setPosition(Math.round(x), Math.round(y))
    this._window.show()
    this._isVisible = true
    this.emit('after-show')
    return
  }
  /**
   * Callback on tray icon click or double-click.
   *
   * @param e
   * @param bounds
   */
  private async clicked(event?: Electron.KeyboardEvent, bounds?: Electron.Rectangle): Promise<void> {
    if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      return this.hideWindow()
    }

    // if blur was invoked clear timeout
    if (this._blurTimeout) {
      clearInterval(this._blurTimeout)
    }

    if (this._window && this._isVisible) {
      return this.hideWindow()
    }

    this._cachedBounds = bounds || this._cachedBounds
    await this.showWindow(this._cachedBounds)
  }

  private async createWindow(): Promise<void> {
    this.emit('create-window')
    const preload = path.join(__dirname, '../preload/index.js')
    const url = process.env.VITE_DEV_SERVER_URL
    const indexHtml = path.join(process.env.DIST, 'index.html')
    // We add some default behavior for menubar's browserWindow, to make it
    // look like a menubar
    const defaults: BrowserWindowConstructorOptions = {
      show: false, // Don't show it at first
      frame: false, // Remove window frame
      // alwaysOnTop: true, // Keep it on top of other windows
      skipTaskbar: true, // Don't show it in the taskbar
      fullscreenable: false, // Don't allow fullscreen
    }

    this._window = new BrowserWindow({
      ...defaults,
      title: 'Overlayed',
      icon: path.join(process.env.PUBLIC, 'favicon.ico'),
      width: 400,
      webPreferences: {
        preload,
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    this._positioner = new Positioner(this._window)

    this._window.on('blur', () => {
      if (!this._window) {
        return
      }

      // hack to close if icon clicked when open
      this._window.isAlwaysOnTop()
        ? this.emit('focus-lost')
        : (this._blurTimeout = setTimeout(() => {
            this.hideWindow()
          }, 100))
    })

    this._window.setVisibleOnAllWorkspaces(true)

    this._window.on('close', this.windowClear.bind(this))

    this.emit('before-load')
    if (process.env.VITE_DEV_SERVER_URL) {
      // electron-vite-vue#298
      this._window.loadURL(url)
      // Open devTool if the app is not packaged
      this._window.webContents.openDevTools({ mode: 'detach' })
    } else {
      this._window.loadFile(indexHtml)
    }
    this._window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })
    this.emit('after-create-window')
  }
  private updateTray(): void {
    this.tray.setToolTip(`Overloaded - ${this.overlays.length} Overlays`)
  }
  private windowClear(): void {
    this.window.close()
    this._window = undefined
    this.emit('after-close')
  }

  newOverlay(options: OverlayOptions) {
    if (!this._window) {
      throw new Error('Window should have been instantiated by now')
    }
    if (this.overlays.findIndex((overlay) => overlay.name === options.name) !== -1) {
      throw new Error('Overlay with this name already exists')
    }
    const overlay = new Overlay(options)
    this.overlays.push(overlay)
    this.saveOverlays()
    this.updateTray()
  }

  async editOverlay(name: string, options: OverlayOptions) {
    if (!this._window) {
      throw new Error('Window should have been instantiated by now')
    }
    if (this.overlays.findIndex((overlay) => overlay.name.toLowerCase() === options.name.toLowerCase()) === -1) {
      throw new Error("Overlay with this name doesn't exist")
    }
    const overlay = this.overlays.find((overlay) => overlay.name.toLowerCase() === name.toLowerCase())
    overlay.update(options)
    this.saveOverlays()
    this.updateTray()
    return overlay.toJson()
  }
  saveOverlays() {
    const overlaysJson = this.overlays.map((overlay) => overlay.toJson())
    store.set('overlays', overlaysJson)
  }
}
export default MainWindow
