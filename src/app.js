const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification, shell } = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const open = require('open');

let tray = null;

app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/settings.json')));

function createWindow () {
  const win = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
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
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('focus-search');
  });
  if (!ret) {
    console.log('registration failed')
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered('Alt+Z') ? 'GLobal shortcut is registered' : 'GLobal shortcut failed registration')
})

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('ALt+Z')

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
ipcMain.on('open-url', (event, url) => {
    shell.openExternal(url);
});
ipcMain.on('open-app', (event, appIdentifier) => {
    try {
    if (process.platform === 'darwin') {
      open('', {app: {name: appIdentifier}}); // appIdentifier: 'TextEdit'
    } else if (process.platform === 'win32') {
      // On Windows open() prefers files; use cmd start to open an app by executable name:
      const { exec } = require('child_process');
      exec(`start "" "${appIdentifier}"`);
    } else {
      // Linux: try to run executable name
      const { spawn } = require('child_process');
      spawn(appIdentifier, [], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    console.error('Failed to open app', err);
  }
});