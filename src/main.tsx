import 'normalize.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@blueprintjs/core/lib/css/blueprint.css'

import './samples/node-api'
import './index.scss'
import Root, { rootLoader } from './routes/root'
import { HashRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/home'
import Settings from './routes/settings'
import type { ipcRenderer } from 'electron'

declare global {
  var ipc: typeof ipcRenderer
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <HashRouter>
    <Root />
  </HashRouter>
)

postMessage({ payload: 'removeLoading' }, '*')
