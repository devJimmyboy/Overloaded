export interface IOverlay {
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
