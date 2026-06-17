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
function openApp(app) {
  ipcRenderer.send('open-app', app);
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
          openApp(getSearch().value);
        } else {
          RunSearch();
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

const unitNames = {
  "in": ["inches", "inch", "in"],
  "ft": ["feet", "foot", "ft"],
  "mi": ["miles", "mile", "mi"],
  "km": ["kilometers", "kilometer", "km"],
  "m": ["meters", "meter", "m"],
  "cm": ["centimeters", "centimeter", "cm"],
  "mm": ["millimeters", "millimeter", "mm"],
  "yd": ["yards", "yard", "yd"],
  "lb": ["pounds", "pound", "lbs", "lb"],
  "kg": ["kilograms", "kilogram", "kg"],
  "g": ["grams", "gram", "g"],
  "oz": ["ounces", "ounce", "oz"],
  "ml": ["milliliters", "milliliter", "ml"],
  "cl": ["centiliters", "centiliter", "cl"],
  "l": ["liters", "liter", "l"],
  "cup": ["cups", "cup", "cu"],
  "tsp": ["teaspoons", "teaspoon", "tsp"],
  "tbsp": ["tablespoons", "tablespoon", "tbsp"],
  "fl oz": ["fluidounces", "fluidounce", "floz"],
  "pt": ["pints", "pint", "pt"],
  "qt": ["quarts", "quart", "qt"],
  "gal": ["gallons", "gallon", "gal"],
  "min": ["minutes", "minute", "min"],
  "hr": ["hours", "hour", "hr"],
  "s": ["seconds", "second", "s"],
  "ms": ["milliseconds", "millisecond", "ms"],
  "F": ["fahrenheit", "f"],
  "C": ["celsius", "c"],
  "K": ["kelvin", "k"]
};

const conversionsStart = {
  // Length
  "in-ft": 1 / 12,
  "ft-in": 12,

  "in-mi": 1 / 63360,
  "mi-in": 63360,

  "mi-km": 1.60934,
  "km-mi": 1 / 1.60934,

  "km-ft": 3280.8399,
  "ft-km": 1 / 3280.8399,

  "m-cm": 100,
  "cm-m": 1 / 100,

  "m-mm": 1000,
  "mm-m": 1 / 1000,

  "m-ft": 3.28084,
  "ft-m": 1 / 3.28084,

  "yd-ft": 3,
  "ft-yd": 1 / 3,

  "yd-mi": 1 / 1760,
  "mi-yd": 1760,

  // Mass
  "lb-kg": 0.453592,
  "kg-lb": 1 / 0.453592,

  "kg-g": 1000,
  "g-kg": 1 / 1000,

  "g-oz": 1 / 28.34952,
  "oz-g": 28.34952,

  "oz-lb": 1 / 16,
  "lb-oz": 16,

  // Volume
  "ml-l": 1 / 1000,
  "l-ml": 1000,

  "l-cl": 100,
  "cl-l": 1 / 100,

  "tsp-tbsp": 1 / 3,
  "tbsp-tsp": 3,

  "tbsp-fl oz": 1 / 2,
  "fl oz-tbsp": 2,

  "pt-qt": 1 / 2,
  "qt-pt": 2,

  "qt-gal": 1 / 4,
  "gal-qt": 4,

  // US gallons
  "gal-l": 3.78541,
  "l-gal": 1 / 3.78541,

  // Time
  "min-s": 60,
  "s-min": 1 / 60,

  "s-ms": 1000,
  "ms-s": 1 / 1000,

  "hr-s": 3600,
  "s-hr": 1 / 3600,

  "hr-min": 60,
  "min-hr": 1 / 60
};
const specialConversions = {
  "F-C": (x) => (x - 32) * 5 / 9,
  "C-F": (x) => x * 9 / 5 + 32,
  "K-F": (x) => (x - 273.15) * 9/5 + 32,
  "F-K": (x) => (x - 32) * (5 / 9) + 273.15,
  "K-C": (x) => x - 273.15,
  "C-K": (x) => x + 273.15
};

function getAllConverstions() {
  const conversions = {};
  const units = Object.keys(unitNames);

  for (const unit of units) {
    for (const unit2 of units) {
      if (unit === unit2) continue;

      const key = unit + "-" + unit2;

      if (key in conversionsStart) {
        conversions[key] = conversionsStart[key];
      } else {
        conversions[key] = getConversion(
          unit,
          unit2,
          0,
          10,
          1,
          new Set()
        );
      }
    }
  }

  return conversions;
}

function getConversion(
  from,
  to,
  depth,
  maxDepth,
  conversion,
  visited
) {
  if (depth > maxDepth) return NaN;
  if (visited.has(from)) return NaN;

  visited.add(from);

  const units = Object.keys(unitNames);

  for (const unit of units) {
    const key = from + "-" + unit;

    if (!(key in conversionsStart)) continue;

    const newConversion =
      conversion * conversionsStart[key];

    if (unit === to) {
      return newConversion;
    }

    const conv = getConversion(
      unit,
      to,
      depth + 1,
      maxDepth,
      newConversion,
      new Set(visited)
    );

    if (!isNaN(conv)) {
      return conv;
    }
  }

  return NaN;
}

const conversions = getAllConverstions();

function getSearch() { return document.getElementById('search'); }

function floor(x) {
  return Math.floor(x);
}
function formatTimeInt(x) {
  return floor(x).toString().padStart(2, "0");
}

function RunSearch() {
  val = getSearch().value;
  fetchAsync(getSearch().value.replaceAll(" ", "+")).then(data => {
    if (data.pages.length > 0 && val == getSearch().value) {
      const resultEl = document.getElementsByClassName('result')[0];
      for (const page of data.pages) {
        if (page.description != "Topics referred to by the same term") {
          resultEl.textContent = `${page.description}`;
          break;
        }
      }
      const img = document.createElement('img');
      img.src = icons['search'];
      img.alt = '';
      resultEl.appendChild(img);
    }
  });
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
  'search': '../static/images/wiki.svg',
};
var features = [];
var runFunctions = [];
var checkFunctions = [];
(async () => {
files = await fetch('extentions/extentions.json').then(response => response.json());
for (const file of Object.keys(files)) {
  let data = files[file];
  if (data.active) {
    let code = await fetch(`extentions/${data.file}`).then(response => response.text());
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