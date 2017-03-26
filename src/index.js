const electron = require('electron');
const fs = require('fs');
const path = require('path');
const app = electron.app;
const globalShortcut = electron.globalShortcut;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
const info_path = path.join(app.getPath("userData"), "bounds-info.json");

let mainWindow;

function createWindow () {
  var bounds;
  try {
    bounds = JSON.parse(fs.readFileSync(info_path, 'utf8'));
  } catch (e) {
    bounds = {width: 800, height: 600};
  }

  mainWindow = new BrowserWindow(bounds);
  mainWindow.setMenu(null);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', function () {
    fs.writeFileSync(info_path, JSON.stringify(mainWindow.getBounds()));
  });

  mainWindow.on('closed', function () {
    mainWindow = null
  });
}

app.on('ready', function(){
  globalShortcut.register('ctrl+alt+Enter', function(){
    mainWindow.focus();
    mainWindow.webContents.send('activate_message_form');
  });

  ipcMain.on('attention', function(){
    mainWindow.flashFrame(true);
  });

  createWindow();
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()}
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});
