const path = require('node:path');
const fs = require('fs');
const { exec } = require('child_process');
const { app } = require('electron/main');

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/settings.json')));

var packageCache = null;
var iconCache = new Map();

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
  return s.normalize('NFKD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, '');
}

function similarity(a, b) {
  a = normalize(a); b = normalize(b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinOptimized(a, b);
  return 1 - dist / maxLen;
}

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

function loadPackages() {
    return new Promise((resolve, reject) => {
        if (packageCache) return resolve(packageCache);

        exec(
            'powershell -NoProfile -Command "Get-AppxPackage | Select PackageFamilyName, InstallLocation | ConvertTo-Json"',
            { maxBuffer: 1024 * 1024 * 10 },
            (err, stdout) => {
                if (err) return reject(err);

                packageCache = JSON.parse(stdout);
                if (!Array.isArray(packageCache))
                    packageCache = [packageCache];

                resolve(packageCache);
            }
        );
    });
}

function resolveAppIdToPath(appId) {
    return new Promise((resolve) => {
        const ps = `try{$s=New-Object -ComObject Shell.Application;$f=$s.NameSpace("shell:AppsFolder");$i=$f.ParseName("${appId}");if($i){$i.Path}else{""}}catch{""}`;
        const enc = Buffer.from(ps, 'utf16le').toString('base64');
        exec(`powershell -NoProfile -EncodedCommand ${enc}`, { timeout: 5000 }, (err, stdout) => {
            if (err) { resolve(null); return; }
            const p = stdout.trim();
            resolve(p || null);
        });
    });
}

async function getAppIcon(appObj) {
    if (!appObj) return null;
    if (iconCache.has(appObj.name)) return iconCache.get(appObj.name);

    let iconResult = null;

    if (appObj.type === 'uwp') {
        const family = appObj.appId.split("!")[0];
        const packages = await loadPackages();
        const pkg = packages.find(p => p.PackageFamilyName === family);
        if (pkg) {
            const manifestPath = path.join(pkg.InstallLocation, "AppxManifest.xml");
            if (fs.existsSync(manifestPath)) {
                const xml = fs.readFileSync(manifestPath, "utf8");
                const match = xml.match(/Square44x44Logo="([^"]+)"/i) || xml.match(/Square150x150Logo="([^"]+)"/i);
                if (match) {
                    const relative = match[1].replace(/\//g, "\\");
                    const candidates = [
                        relative.replace(".png", ".scale-400.png"),
                        relative.replace(".png", ".scale-200.png"),
                        relative.replace(".png", ".scale-150.png"),
                        relative.replace(".png", ".scale-125.png"),
                        relative
                    ];
                    for (const candidate of candidates) {
                        const full = path.join(pkg.InstallLocation, candidate);
                        if (fs.existsSync(full)) { iconResult = full; break; }
                    }
                }
            }
        }
    } else if (appObj.type === 'win32') {
        let target = appObj.iconPath || appObj.targetPath;
        if (!target && appObj.appId) {
            target = await resolveAppIdToPath(appObj.appId);
            if (target) appObj.targetPath = target;
        }
        if (target) {
            target = target.split(',')[0].trim();
            target = target.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
            target = target.replace(/\//g, '\\');
            if (target && fs.existsSync(target)) {
                try {
                    const nativeImage = await app.getFileIcon(target, { size: 'small' });
                    iconResult = nativeImage.toDataURL();
                } catch (e) {
                    console.error('Icon extract error:', e);
                }
            }
        }
    }

    iconCache.set(appObj.name, iconResult);
    return iconResult;
}

var appList = [];
function getApps() {
  const psScript = `$apps=@();$dirs=@([Environment]::GetFolderPath("CommonStartMenu"),[Environment]::GetFolderPath("StartMenu"));foreach($dir in $dirs){if(Test-Path $dir){Get-ChildItem $dir -Recurse -Filter *.lnk -ErrorAction SilentlyContinue|%{$n=[IO.Path]::GetFileNameWithoutExtension($_.Name);$t="";$i="";try{$s=New-Object -ComObject WScript.Shell;$c=$s.CreateShortcut($_.FullName);$t=$c.TargetPath;$i=$c.IconLocation}catch{};if($n){$apps+=[PSCustomObject]@{Name=$n;TargetPath=$t;IconLocation=$i}}}}};$apps|ConvertTo-Json -Compress`;
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

  exec(
    `powershell -NoProfile -EncodedCommand ${encoded}`,
    { maxBuffer: 1024 * 1024 * 10 },
    (err, stdout) => {
      if (err) { console.error('Start Menu scan error:', err); return; }
      try {
        var win32Apps = JSON.parse(stdout);
        if (!Array.isArray(win32Apps)) win32Apps = [win32Apps];
        for (const app of win32Apps) {
          if (app.Name) {
            const entry = { name: app.Name, appId: '', type: 'win32', targetPath: app.TargetPath || '', iconPath: app.IconLocation || '' };
            const idx = appList.findIndex(a => a.name === app.Name);
            if (idx >= 0) appList[idx] = entry; else appList.push(entry);
          }
        }
      } catch (e) { console.error('Parse error:', e); }
    }
  );

  exec(
    'powershell -NoProfile -Command "Get-StartApps | ConvertTo-Json"',
    { maxBuffer: 1024 * 1024 * 10 },
    (err, stdout) => {
      if (err) { console.error(err); return; }
      try {
        var apps = JSON.parse(stdout);
        if (!Array.isArray(apps)) apps = [apps];
        for (const app of apps) {
          if (app.Name && !appList.some(a => a.name === app.Name)) {
            const isUwp = app.AppID && app.AppID.includes('!');
            appList.push({ name: app.Name, appId: app.AppID || '', type: isUwp ? 'uwp' : 'win32', targetPath: '', iconPath: '' });
          }
        }
      } catch (e) { console.error('Parse error:', e); }
    }
  );
}
getApps();

console.log("valid apps found\nsearching for files...");

const filesForSearch = [];
const filesHash = {};
var initDirs = [
  settings['search-files']['starting-dirs']['desktop'] ? path.join(process.env.USERPROFILE, 'Desktop') : null,
  settings['search-files']['starting-dirs']['documents'] ? path.join(process.env.USERPROFILE, 'Documents') : null,
  settings['search-files']['starting-dirs']['downloads'] ? path.join(process.env.USERPROFILE, 'Downloads') : null,
  settings['search-files']['starting-dirs']['pictures'] ? path.join(process.env.USERPROFILE, 'Pictures') : null,
  settings['search-files']['starting-dirs']['music'] ? path.join(process.env.USERPROFILE, 'Music') : null,
  settings['search-files']['starting-dirs']['videos'] ? path.join(process.env.USERPROFILE, 'Videos') : null,
];
function getFiles() {
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
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory() && !file.includes(".") && checkPermissionsSync(filePath) && !settings['search-files']['invalid-directories'].includes(file)) {
        getFilesFor(filePath, depth, maxDepth);
        filesHash[file] = filePath;
        filesForSearch.push(file);
      } else if (file.endsWith("." + settings['search-files']['invalid-file-extensions'].join("."))) {
      } else if (fs.statSync(filePath).isFile()) {
        filesHash[file] = filePath;
        filesForSearch.push(file);
      }
    }
  }
}
getFiles();
function findBestMatchFiles(query, candidates) {
  var cands = candidates;
  query = query.replaceAll("\\", "/");
  if (query.includes("/")) {
    if (query.includes("C:")) {
      for (i = 0; i < query.split("/").length - 1; i++) {
        folder = query.split("/")[i];
        for (initFile of initDirs) {
          if (filesHash[folder] == initFile) {
            query = query.split("/").splice(i).join("/");
            break;
          }
        }
      }
    }
    for (i = 0; i < query.split("/").length - 1; i++) {
      folder = query.split("/")[i];
      var foundFolder = findBestMatch(folder, cands);
      searchThrough = true;
      for (initFile of initDirs) {
        if (filesHash[foundFolder.best] == initFile) {
          searchThrough = false;
          break;
        }
      }
      if (searchThrough) {
        initDirs.push(filesHash[foundFolder.best]);
        getFilesFor(filesHash[foundFolder.best], 1, settings['search-files']['initial-max-depth']);
      }
    }
    var foundFolder = null;
    for (folder of query.split("/")) {
      foundFolder = findBestMatch(folder, cands);
      cands = cands.filter(c => filesHash[c].includes(foundFolder.best));
    }
    return { best: foundFolder.best, index: candidates.indexOf(foundFolder), score: foundFolder.score };
  } else {
    return findBestMatch(query, candidates);
  }
}
async function resolvePathForQuery(query, shouldOpen) {
  try {
    if (process.platform !== 'win32') {
      return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
    }

    const appNames = appList.map(app => app.name);
    let closest = findBestMatch(query, appNames);
    if (closest && closest.score > 0.5) {
      const closestApp = appList[closest.index];
      if (shouldOpen) {
        console.log(closestApp.appId, closestApp.name);
        if (closestApp.type === 'win32' && closestApp.targetPath) {
          exec(`start "" "${closestApp.targetPath}"`);
        } else {
          exec(`explorer.exe shell:AppsFolder\\${closestApp.appId}`);
        }
      }
      const icon = await getAppIcon(closestApp);
      return { ok: true, file: closestApp.name, action: (shouldOpen ? 'Open' : 'Found'), type: 'app', icon: icon };
    }

    closest = findBestMatchFiles(query, filesForSearch);
    if (!closest || closest.best === undefined) {
      return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
    }

    const filePath = filesHash[closest.best];
    if (shouldOpen) {
      exec(`start "" "${filePath}"`);
    }
    return { ok: true, file: filePath, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  } catch (err) {
    console.error('Failed to open app', err);
    return { ok: false, file: null, action: shouldOpen ? 'Open' : 'Found', type: 'file' };
  }
}

module.exports = { resolvePathForQuery };
