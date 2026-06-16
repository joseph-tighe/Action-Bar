const { app, Tray, BrowserWindow } = require('electron/main')
const path = require('node:path')

let tray = null;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js')
    }
  })

  win.loadFile('src/index.html');
}

app.whenReady().then(() => {
  tray = new Tray('static/images/icon.png');
  tray.setToolTip('Launch Hub');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})