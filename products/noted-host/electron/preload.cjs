const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize'),
})
