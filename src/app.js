const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification, shell, screen, ipcRenderer, Menu } = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const open = require('open');
const { exec } = require('child_process');
const https = require('https');
const AdmZip = require('adm-zip');
const { resolvePathForQuery } = require('./appFinder');

let tray = null;

console.log(__dirname);
app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/settings.json')));

function createWindow() {
  const win = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    icon: path.join(__dirname, "../../static/images/icon.ico"), // Windows
    transparent: true,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    frame: false

  })
  win.setTitle('Action Bar');
  win.loadFile(path.join(__dirname, '../../src/index.html'));
  return win;
}
mainWindow = null;
app.whenReady().then(() => {
  console.log(__dirname); 
  tray = new Tray(path.join(__dirname, '../../static/images/icon.png'));
  tray.setToolTip('Action Bar');
  tray.on('click', () => {
    toggleWindowVisibility();
  })
  mainWindow = createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
    mainWindow.hide();
  })
  mainWindow.hide();
  const ret = globalShortcut.register(settings['shortcuts']['open-shortcut'], () => {
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
  console.log(globalShortcut.isRegistered(settings['shortcuts']['open-shortcut']) ? 'Global shortcut is registered' : 'GLobal shortcut failed registration')
})

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister(settings['shortcuts']['open-shortcut'])

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
    if (settings['summon']['change-screen']) {
      scr = getScreen();
      if (settings['summon']['summon-on-mouse']) {
        mainWindow.setPosition(screen.getCursorScreenPoint().x - mainWindow.getSize()[0] / 2, screen.getCursorScreenPoint().y - settings['summon']['vertical-offset'], true);
      } else {
        mainWindow.setPosition(Math.round(scr.workArea.x + scr.bounds.width / 2 - mainWindow.getSize()[0] / 2), Math.round(scr.workArea.y + scr.bounds.height / 2 - settings['summon']['vertical-offset']), true);
      }
    }
    mainWindow.show();
  }
}

function getScreen() {
  for (const scr of screen.getAllDisplays()) {
    if (scr.bounds.x <= screen.getCursorScreenPoint().x && scr.bounds.y <= screen.getCursorScreenPoint().y && scr.bounds.x + scr.bounds.width >= screen.getCursorScreenPoint().x && scr.bounds.y + scr.bounds.height >= screen.getCursorScreenPoint().y) {
      return scr;
    }
  }
  return screen.getPrimaryDisplay();
}
ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});
ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url);
});
ipcMain.handle('run-bash', async (event, command) => {
  return new Promise((resolve, reject) => {
    const normalizedCommand = String(command || '').trim().replace(/^\$\s*/, '');
    exec(normalizedCommand, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
        return;
      }
      resolve(stdout.trim());
    });
  });
});

ipcMain.handle('search-apps/files', async (event, query) => {
  const result = await resolvePathForQuery(query, false);
  event.sender.send('open-file', result);
  return result;
});

ipcMain.handle('search-open-apps/files', async (event, query) => {
  const result = await resolvePathForQuery(query, true);
  event.sender.send('open-file', result);
  return result;
});
ipcMain.on('quit', () => {
  app.quit();
});
ipcMain.on('close-window', (event) => {
  toggleWindowVisibility();
});
ipcMain.on('open-settings', (event) => {
  Menu.setApplicationMenu(null);
  settingsWindow = new BrowserWindow({
    width: settings['window']['width'],
    height: settings['window']['height'],
    icon: path.join(__dirname, "../../static/images/icon.ico"),
    transparent: false,
    //vibrancy: 'fullscreen-ui',    // on MacOS
    //backgroundMaterial: 'acrylic', // on Windows 11
    resizable: true, // Optional: prevents resizing
    webPreferences: {
      preload: path.join(__dirname, '../../src/settings/preload.js'),
      sandbox: false
    },
    frame: true
  })
  settingsWindow.loadFile(path.join(__dirname, '../../src/settings/index.html'));
  settingsWindow.on('blur', () => {
    settingsWindow.hide();
  });
  settingsWindow.on('focus', () => {
    settingsWindow.webContents.send('focus-search');
  });
});
ipcMain.on('update-settings', (event, settings) => {
  fs.writeFileSync(path.join(__dirname, '../../config/settings.json'), JSON.stringify(settings, null, 4));
});
ipcMain.on('update-extention-settings', (event, extensionSettings, dirMap) => {
  for (const [name, settings] of Object.entries(extensionSettings)) {
    const dir = dirMap[name];
    if (!dir) continue;
    const manifestPath = path.join(__dirname, `../../src/extentions/${dir}/manifest.json`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.settings = settings;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
  }
});
ipcMain.on('get-extentions', (event) => {
  fileList = [];
  fs.readdirSync(path.join(__dirname, '../../src/extentions')).forEach(file => {
    if (fs.statSync(path.join(__dirname, '../../src/extentions', file)).isDirectory()) {
      fileList.push(file);
    }
  });
  event.reply('get-extentions', fileList);
});

function downloadExtensionZip(git_repo) {
  const URL = `https://github.com/${git_repo}/archive/refs/heads/main.zip`;
  console.log(URL);
  const name = git_repo.split('/').pop();
  const file = fs.createWriteStream(path.join(__dirname, `../../src/extentions/${name}.zip`));
  https.get(URL, function (response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
      https.get(response.headers.location, (response) => {
        response.pipe(file);
        file.on('finish', function () {
          file.close();
          extractZip(path.join(__dirname, `../../src/extentions/${name}.zip`), path.join(__dirname, '../../src/extentions'));
        });
      });
    } else {
      response.pipe(file);
      file.on('finish', function () {
        file.close();
        extractZip(path.join(__dirname, `../../src/extentions/${name}.zip`), path.join(__dirname, '../../src/extentions'));
      });
    }
  });
}
function extractZip(file, dest) {
  const zip = new AdmZip(file);
  zip.extractAllTo(dest, true);
}

ipcMain.on('download-extention', async (event, git_repo) => {
  downloadExtensionZip(git_repo);
}); 
app.whenReady().then(() => {
  setTimeout(() => {
    console.log("app ready");
    toggleWindowVisibility();
  }, 500);
});
