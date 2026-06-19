const { contextBridge, ipcRenderer } = require('electron');

ipcRenderer.on('focus-search', () => {
  getSearch().focus();
}); 

var settingsLoaded = false;
var settings = {};
fetch("../config/settings.json").then(response => response.json()).then(data => {
  settings = data;
  settingsLoaded = true;
});

window.addEventListener('DOMContentLoaded', () => {

const start = Date.now();
function waitForSearch() {
const s = getSearch();
if (s) {
s.click();
return;
}
if (Date.now() - start < 5000) {
requestAnimationFrame(waitForSearch);
}
}
waitForSearch();

document.addEventListener('click', (e) => {
const s = getSearch();
if (!s) return;
if (e.target.closest && e.target.closest('#search')) {
e.preventDefault();
s.blur();
s.focus({ preventScroll: true });
} else {
s.click();
}
}, true);
function Quit() {
  window.close();
}
function userSelection() {
  if (!settings['tool-declorable']) return 'nothing';
  value = getSearch().value.toLowerCase();
  if (value[0] == settings['tool-decloration-char']) {
    for (feature of features) {
      if (value.split(" ")[0].includes(feature.toLowerCase())) {
        return feature;
      }
    }
    if (value.split(" ")[0].includes("quit")) {
      return 'quit';
    }
  }
  return 'nothing';
}

getSearch().addEventListener('keyup', (e) => {
  if (e.key) {
    item = userSelection();
    hasGone = false;
    for (let i = 0; i < features.length; i++) {
      if (item === features[i]) {
        runFunctions[i](e.key === 'Enter');
        hasGone = true;
        break;
      }
    }
    if (!hasGone) {
      if (item === 'quit') {
        Quit();
        hasGone = true;
      }
    }
    if (!hasGone) {
      for (let i = 0; i < features.length; i++) {
        if (checkFunctions[i] != null && checkFunctions[i]()) {
          runFunctions[i](e.key === 'Enter');
          hasGone = true;
          break;
        }
      }
    }
    if (!hasGone) {
      if (getSearch().value.length > 0) {
        if (e.key === 'Enter') {
          runFunctions[features.indexOf(settings['defult-extention-onEnter'])](true);
        } else {
          console.log(settings['defult-extention'], features);
          console.log(features.indexOf(settings['defult-extention']));
          runFunctions[features.indexOf(settings['defult-extention'])](false);
        }
      } else {
        const resultEl = document.getElementsByClassName('result')[0];
        resultEl.textContent = " ";
        const img = document.createElement('img');
        img.src = "";
        img.alt = '';
        resultEl.appendChild(img);
      }
    }
  }
});
setTimeout(async () => {
  while (!settingsLoaded) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(settings);
  document.documentElement.style.setProperty('--background', settings['style']['background']);
  document.documentElement.style.setProperty('--foreground', settings['style']['foreground']);
  document.documentElement.style.setProperty('--borderradius', settings['style']['borderradius']);
  document.documentElement.style.setProperty('--shadowstrength', settings['style']['shadowstrength']);
  document.documentElement.style.setProperty('--answerbarwidth', settings['style']['answerbarwidth']);
  document.documentElement.style.setProperty('--searchwidth', settings['style']['searchwidth']);
  document.documentElement.style.setProperty('--bottomradius', parseFloat(settings['style']['answerbarwidth'].replace("%", "")) >= 99 ? '0px' : settings['style']['borderradius']);
  document.documentElement.style.setProperty('--expandability', (100-parseFloat(settings['style']['expandability'].replace("%", "")))/100);
}, 100);
});

function getSearch() { return document.getElementById('search'); }

function floor(x) {
  return Math.floor(x);
}
function formatTimeInt(x) {
  return floor(x).toString().padStart(2, "0");
}

function getCurrentPosition(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    const opts = { enableHighAccuracy: true, timeout, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(err),
      opts
    );
  });
}

var icons = {
  'app': '../static/images/app.svg',
};
var features = [];
var runFunctions = [];
var checkFunctions = [];
(async () => {
files = await fetch('extentions/extentions.json').then(response => response.json());
console.log(files);
for (const file of Object.keys(files)) {
  let data = files[file];
  if (data.active) {
    let code = await fetch(`extentions/${data.file}`).then(response => response.text());
    console.log(code);
    eval(code); //make functions
    let feature = eval(`(() => {
      return {
        "RunFunction": ${data.RunFunction},
        "CheckFunction": ${data.CheckFunction}
      }  
    })();`)
    features.push(data.name);
    icons[data.name] = data.imageUrl;
    runFunctions.push(feature.RunFunction);
    checkFunctions.push(feature.CheckFunction);
  }
}
})();

async function doFetch(q) {
  let url = "https://en.wikipedia.org/w/rest.php/v1/search/page";
  let headers = {'Api-User-Agent': 'MediaWiki REST API docs examples/0.1 (https://www.mediawiki.org/wiki/API_talk:REST_API)'}
  let params = {
    'q': q,
    'limit': '20'
  };
  let query = Object.keys(params)
             .map(k => k + '=' + encodeURIComponent(params[k]))
             .join('&');
  url = url + '?' + query;

  const rsp = await fetch(url, headers);
  const data = await rsp.json();
  return data;
}

async function fetchAsync(q)
{
  try {
    let result = await doFetch(q);
    return result;
  } catch( err ) {
    console.error( err.message );
  }
  return "";
}