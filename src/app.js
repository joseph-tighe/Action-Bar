const { app, Tray, BrowserWindow, globalShortcut, ipcMain, Notification, shell, screen, ipcRenderer } = require('electron/main')
const path = require('node:path')
const fs = require('fs');
const open = require('open');
const { exec } = require('child_process');

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
      mainWindow.setPosition(screen.getPrimaryDisplay().workArea.x/2, screen.getPrimaryDisplay().workArea.y/2, true);
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
    if (settings['summon']['change-screen']) {
      scr = getScreen();
      if (settings['summon']['summon-on-mouse']) {
        mainWindow.setPosition(screen.getCursorScreenPoint().x-mainWindow.getSize()[0]/2, screen.getCursorScreenPoint().y-settings['summon']['vertical-offset'], true);
      } else {
        mainWindow.setPosition(Math.round(scr.workArea.x+scr.bounds.width/2-mainWindow.getSize()[0]/2), Math.round(scr.workArea.y+scr.bounds.height/2-settings['summon']['vertical-offset']), true);
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
function levenshteinOptimized(a, b) {
  if (a === b) return 0;
  if (a.length > b.length) [a, b] = [b, a];
  const n = a.length, m = b.length;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  for (let i = 0; i <= n; i++) prev[i] = i;
  for (let j = 1; j <= m; j++) {
    const bj = b[j - 1];
    let curr = [j];
    for (let i = 1; i <= n; i++) {
      const cost = a[i - 1] === bj ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function normalize(s) {
  return s.normalize('NFKD').replace(/\p{Diacritic}/gu, '') // remove accents
           .toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, ''); // optional punctuation removal
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinOptimized(a, b);
  return 1 - dist / maxLen; // range 0..1
}

// Find best match (returns {best, score, index})
function findBestMatch(query, candidates) {
  let bestIdx = -1, bestScore = -1;
  for (let i = 0; i < candidates.length; i++) {
    const s = candidates[i];
    const score = similarity(query, s);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { best: candidates[bestIdx], index: bestIdx, score: bestScore };
}

function getApps() {
  // look through start menu
  const desktop = path.join(process.env.USERPROFILE, 'Desktop');
  const appList = [];
  if (fs.existsSync(desktop)) {
    const files = fs.readdirSync(desktop);
    for (const file of files) {
      const filePath = path.join(desktop, file);
      if (fs.statSync(filePath).isDirectory()) {
        const appName = path.basename(filePath);
        const appPath = path.join(filePath, 'Uninstall.exe');
        if (fs.existsSync(appPath)) {
          appList.push({ name: appName, path: appPath });
        }
      } else if (file.endsWith('.lnk')) {
        const appName = path.basename(filePath, '.lnk');
        const appPath = path.join(filePath);
        if (fs.existsSync(appPath)) {
          appList.push({ name: appName, path: appPath });
        }
      }
    }
  }
  return appList;
}
const appList = getApps();

console.log("valid apps found\nsearching for files...");

//keep list of files
const filesForSearch = [];
const filesHash = {};
function getFiles() {
  const initDirs = [
    settings['search-files']['starting-dirs']['desktop'] ? path.join(process.env.USERPROFILE, 'Desktop') : null,
    settings['search-files']['starting-dirs']['documents'] ? path.join(process.env.USERPROFILE, 'Documents') : null,
    settings['search-files']['starting-dirs']['downloads'] ? path.join(process.env.USERPROFILE, 'Downloads') : null,
    settings['search-files']['starting-dirs']['pictures'] ? path.join(process.env.USERPROFILE, 'Pictures') : null,
    settings['search-files']['starting-dirs']['music'] ? path.join(process.env.USERPROFILE, 'Music') : null,
    settings['search-files']['starting-dirs']['videos'] ? path.join(process.env.USERPROFILE, 'Videos') : null,
  ];
  for (const dir of initDirs) {
    if (dir) {
      getFilesFor(dir, 1, settings['search-files']['initial-max-depth']);
    }
  }
}
function checkPermissionsSync(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function getFilesFor(dir, depth, maxDepth) {
  if (depth > maxDepth) return;
  depth++;
  if (fs.existsSync(dir)) {
    let files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory() && !file.includes(".") && checkPermissionsSync(filePath) && !settings['search-files']['invalid-directories'].includes(file)) {
        getFilesFor(filePath, depth, maxDepth);
        filesHash[file] = filePath;
        filesForSearch.push(file);
      } else if (file.endsWith("." + settings['search-files']['invalid-file-extensions'].join("."))) {
      } else if (fs.statSync(filePath).isFile()) {
        console.log(fs.statSync(filePath).isDirectory() , !file.includes(".") , checkPermissionsSync(filePath) , file != "node_modules");
        filesHash[file] = filePath;
        filesForSearch.push(file);
      }
    }
  }
  console.log(filesForSearch);
}
getFiles();

ipcMain.on('search-apps/files', (event, query) => {
  try {
    if (process.platform === 'win32') {
      // On Windows open() prefers files; use cmd start to open an app by executable name:
      appNames = appList.map(app => app.name);
      closest = findBestMatch(query, appNames);
      if (closest.score > 0.5) {
        event.reply('open-file', { ok: true, file: closest['best'], action: "Found", type: "app" });
        return;
      } else {
        closest = findBestMatch(query, filesForSearch);
        event.reply('open-file', { ok: true, file: filesHash[closest.best], action: "Found", type: "file" });
      }
    }
  } catch (err) {
    console.error('Failed to open app', err);
  }
});

ipcMain.on('search-open-apps/files', (event, query) => {
  try {
    if (process.platform === 'win32') {
      // On Windows open() prefers files; use cmd start to open an app by executable name:
      appNames = appList.map(app => app.name);
      closest = findBestMatch(query, appNames);
      if (closest.score > 0.5) {
        event.reply('open-file', { ok: true, file: closest['best'], action: "Open", type: "app" });
        exec(`start "" "${appList[closest.index].path}"`);
        return;
      } else {
        closest = findBestMatch(query, filesForSearch);
        event.reply('open-file', { ok: true, file: filesHash[closest.best], action: "Open", type: "file" });
      }
      exec(`start "" "${filesHash[closest.best]}"`);
    }
  } catch (err) {
    console.error('Failed to open app', err);
  }
});