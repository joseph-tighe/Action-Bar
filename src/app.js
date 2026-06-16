const { app, Tray, BrowserWindow } = require('electron/main')
const path = require('node:path')

let tray = null;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 100,
    transparent: true,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: false, // Optional: prevents resizing
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
  //mainWindow.hide();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})