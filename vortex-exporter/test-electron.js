const { app, BrowserWindow } = require('electron');
console.log('app:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);
if (app) {
  console.log('whenReady:', typeof app.whenReady);
} else {
  console.log('app is UNDEFINED');
}