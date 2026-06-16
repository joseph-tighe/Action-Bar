const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification } = require('electron/main')
const path = require('node:path')
const fs = require('fs');

let tray = null;

app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 100,
    transparent: true,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false

  })

  win.loadFile('src/index.html');
  return win;
}
mainWindow = null;
app.whenReady().then(() => {
  tray = new Tray('static/images/icon.png');
  tray.setToolTip('Launch Hub');
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  })
  mainWindow = createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
    mainWindow.hide();
  })
  mainWindow.hide();
  const ret = globalShortcut.register('Alt+Z', () => {
    toggleWindowVisibility()
  })

  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('Alt+Z') ? 'GLobal shortcut is registered' : 'GLobal shortcut failed registration')
})

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('CommandOrControl+X')

  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    
  }
})
function toggleWindowVisibility() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
}


ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
});