import Storage from 'electron-store'
import { OverlayOptions } from './Overlay'

interface Store {
  overlays: OverlayOptions[]
}

const store = new Storage<Store>({
  defaults: {
    overlays: [],
  },
})

export default store
