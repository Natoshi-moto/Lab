const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')

const APP_NAME = 'Noted v0.01'
const APP_ID = 'noted-v0.01'
const APP_ROOT = path.resolve(__dirname, '..')

app.setName(APP_NAME)
try { app.setDesktopName(`${APP_ID}.desktop`) } catch (_error) {}
app.setPath('userData', path.join(app.getPath('appData'), APP_ID))
app.setPath('sessionData', path.join(app.getPath('appData'), APP_ID, 'session'))

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations')
}

// Module-level win reference so ipcMain handler has stable access.
let win = null

ipcMain.handle('toggle-maximize', () => {
  if (win) { win.isMaximized() ? win.unmaximize() : win.maximize() }
})

function createWindow() {
  const icon = path.join(APP_ROOT, 'icons', 'noted-v0.01-512.png')
  const indexHtml = path.join(APP_ROOT, 'dist', 'index.html')

  win = new BrowserWindow({
    width: 1280, height: 900, minWidth: 900, minHeight: 640,
    title: APP_NAME, icon,
    backgroundColor: '#14131a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    }
  })

  try { app.setIcon(icon) } catch (_) {}
  win.setIcon(icon)
  win.setMenuBarVisibility(false)
  win.maximize()
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(
      'console.log("[preload check]", typeof window.electronAPI)'
    )
  })
  win.loadFile(indexHtml)
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  win.on('closed', () => { win = null })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
