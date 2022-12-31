import { BrowserWindow } from 'electron'
import windowStateKeeper, { State } from 'electron-window-state'

export interface OverlayOptions {
  name: string
  url: string
  transparent?: boolean
  frame?: boolean
  resizable?: boolean
  alwaysOnTop?: boolean
  show?: boolean
  width?: number
  height?: number
  x?: number
  y?: number
  webPreferences?: Electron.WebPreferences
}

class Overlay {
  private _options: OverlayOptions
  private overlayWindow: BrowserWindow
  private stateKeeper: State
  name: string
  private url: string = ''
  private transparent: boolean = false
  private alwaysOnTop: boolean = true
  private resizable: boolean = false
  private frame: boolean = false
  private show: boolean = true
  constructor(options: OverlayOptions) {
    this._options = options
    this.stateKeeper = windowStateKeeper({
      file: `${options.name}-window-state.json`,
      defaultWidth: options.width,
      defaultHeight: options.height,
    })
    this.name = options.name
    this.url = options.url
    this.transparent = options.transparent
    this.alwaysOnTop = options.alwaysOnTop
    this.resizable = options.resizable
    this.frame = options.frame
    this.show = options.show
    this.reloadWindow()
  }

  toggleTransparency() {
    this.transparent = !this.transparent
    this.reloadWindow()
  }
  toggleShow() {
    if (this.show) this.overlayWindow.hide()
    else this.overlayWindow.show()
    this.show = this.overlayWindow.isVisible()
  }

  toggleAlwaysOnTop() {
    this.alwaysOnTop = !this.alwaysOnTop
    this.overlayWindow.setAlwaysOnTop(this.alwaysOnTop, this.alwaysOnTop ? 'screen-saver' : 'normal')
  }

  toggleEditing() {
    this.resizable = !this.resizable
    this.frame = !this.frame
    this.reloadWindow()
  }

  reloadWindow() {
    if (this.overlayWindow) {
      this.stateKeeper.saveState(this.overlayWindow)
      this.overlayWindow.close()
    }
    this.overlayWindow = null
    this.overlayWindow = new BrowserWindow({
      ...this._options,
      title: this.name,
      transparent: this.transparent,
      resizable: this.resizable,
      frame: this.frame,
      show: false,
      skipTaskbar: true,
      webPreferences: {
        ...this._options.webPreferences,
        nodeIntegration: false,
        contextIsolation: false,
      },
      width: this.stateKeeper.width,
      height: this.stateKeeper.height,
      x: this.stateKeeper.x,
      y: this.stateKeeper.y,
    })
    this.stateKeeper.manage(this.overlayWindow)
    this.overlayWindow.loadURL(this.url)
    this.overlayWindow.on('ready-to-show', () => {
      if (this.show) this.overlayWindow.show()
      if (this.transparent) this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })
      if (this.alwaysOnTop) this.overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    })
  }
  update(options: OverlayOptions) {
    this._options = options
    this.name = options.name
    this.url = options.url
    this.transparent = options.transparent
    this.alwaysOnTop = options.alwaysOnTop
    this.resizable = options.resizable
    this.frame = options.frame
    this.show = options.show
    this.reloadWindow()
  }

  toJson(): OverlayOptions {
    return {
      name: this.name,
      url: this.url,
      transparent: this.transparent,
      alwaysOnTop: this.alwaysOnTop,
      resizable: this.resizable,
      frame: this.frame,
      show: this.show,
      webPreferences: this._options.webPreferences,
      height: this.stateKeeper.height,
      width: this.stateKeeper.width,
      x: this.stateKeeper.x,
      y: this.stateKeeper.y,
    }
  }
}
export default Overlay
