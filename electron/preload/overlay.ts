import { ipcRenderer } from 'electron'

let moving = false

ipcRenderer.on('move', () => {
  if (!moving) {
    moving = true
    document.body.style.setProperty('border', '1px solid red')
  } else {
    moving = false
    document.body.style.setProperty('border', 'none')
  }
})
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

domReady().then(() => {
  document.body.style.setProperty('cursor', 'hand')
  document.body.addEventListener('mousedown', () => {
    document.body.style.setProperty('cursor', 'grabbing')
  })

  document.body.addEventListener('mouseup', () => {
    document.body.style.setProperty('cursor', 'hand')
  })

  document.body.style.setProperty('-webkit-app-region', 'drag')
  document.body.style.setProperty('-webkit-user-select', 'none')
  document.body.style.setProperty('max-height', '99vh')
})
