const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vortex', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Token management
  saveToken: (token) => ipcRenderer.invoke('token-save', token),
  loadToken: () => ipcRenderer.invoke('token-load'),

  // Export from Figma URL
  export: (data) => ipcRenderer.invoke('export', data),

  // Directory selection
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),

  // Open file in explorer
  openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),

  // === JSON Import ===
  // Import/compile a JSON panel file to Lua
  importJson: (data) => ipcRenderer.invoke('import-json', data),
  // Select a .json file from disk
  selectJsonFile: () => ipcRenderer.invoke('select-json-file'),
});
