const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
function getSearch() { return document.getElementById('search'); }

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
function canCalculate() {
  s = getSearch().value;
  let isNumericChar = null;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of s) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? 'calculator' : null;
    if (isNumericChar) {
      
    } else {
      break;
    }
  }
  return isNumericChar;
}
function canConvert() {
  s = getSearch().value;
  if (s.length === 0) return false;
  if (s.includes("to")) {
    return 'converter';
  }
  return false;
}
function userSelection() {
  value = getSearch().value;
  if (value[0] == "@") {
    for (feature of features) {
      if (value.split(" ")[0].includes(feature)) {
        return feature;
      }
    }
  }
  return 'nothing';
}
function canDo() {
  const s = getSearch().value;
  if (s.length === 0) return 'nothing';
  
  if (canCalculate()) {
    return 'calculator';
  } else if (canConvert()) {
    return 'converter';
  } else {
    return 'nothing';
  }
  //TODO: Implement more features
}
function RunCalculator(enter) {
  if (canCalculate()) {
    equation = getSearch().value;
    setNext = false;
    if (equation.includes("=") || enter) {
      equation = equation.replace("=", "");
      setNext = true;
    }
    equation = equation.replaceAll("^", "**");
    const result = eval(equation);
    const resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = result; // for text part
    const img = document.createElement('img');
    img.src = icons['calculator'];
    img.alt = '';
    resultEl.appendChild(img);
    if (setNext) {
      getSearch().value = result;
      getSearch().focus();
    }
  }
}
function getValueAndUnit(value) {
  startingIndex = 0;
  for (char of value) {
    if (char.match(/[1-9]/)) {
      break;
    }
    startingIndex++;
  }
  value2 = value.slice(startingIndex);
  number = "";
  unit = "";
  for (char of value2) {
    if (char.match(/[a-zA-Z]/) || (char === " " && unit === "")) {
      unit += char;
    } else if (unit == "") {
      number += char;
    } else {
      break;
    }
  }
  return [number, unit];
}
function getUnit(value) {
  startingIndex = 0;
  for (char of value) {
    if (char.match(/[a-zA-Z]/)) {
      break;
    }
    startingIndex++;
  }
  value2 = value.slice(startingIndex);
  unit = "";
  for (char of value2) {
    if (unit === "" || unit.match(/[a-zA-Z]/)) {
      unit += char;
    } else {
      break;
    }
  }
  return unit;
}
function formatUnit(unit) {
  unit = unit.toLowerCase();
  unit = unit.replace(" ", "");
  for (key in unitNames) {
    if (unitNames[key].includes(unit)) {
      return key;
    }
  }
  return unit;
}
function RunConverter() {
  if (canConvert() !== 'nothing') {
    valuesString = getSearch().value;
    values = valuesString.split("to");
    if (values.length === 2) {
      var from = values[0];
      var to = values[1];
      if (from[from.length - 1] === " ") {
        from = from.slice(0, -1);
      }
    }
    [FromNumber, FromUnit] = getValueAndUnit(from);
    toUnit = getUnit(to);
    toUnit = formatUnit(toUnit);
    fromUnit = formatUnit(FromUnit);
    var conversion = conversions[fromUnit + "-" + toUnit];
    const resultEl = document.getElementsByClassName('result')[0];
    result = parseFloat(FromNumber) * conversion;
    resultEl.textContent = result; // for text part
    const img = document.createElement('img');
    img.src = icons['converter'];
    img.alt = '';
    resultEl.appendChild(img);
  }
}
function floor(x) {
  return Math.floor(x);
}
function formatTimeInt(x) {
  return floor(x).toString().padStart(2, "0");
}
function openApp(app) {
  ipcRenderer.send('open-app', app);
}
function RunTimer(enter) {
  let value = getSearch().value || "";
  if (value[0] === "@") {
    const parts = value.split("timer");
    if (parts.length < 2) return 'nothing';
    value = "-" + parts[1];
  }
  let numbers = [""];
  for (const ch of value) {
    if (/\d/.test(ch)) numbers[numbers.length-1] += ch;
    else if (numbers[numbers.length-1] !== "") numbers.push("");
  }
  if (numbers[numbers.length-1] === "") numbers.pop();

  let time = NaN;
  if (numbers.length === 1) time = parseInt(numbers[0]) * 60;
  else if (numbers.length === 2) time = parseInt(numbers[0]) * 60 + parseInt(numbers[1]);
  else if (numbers.length === 3) time = parseInt(numbers[0]) * 3600 + parseInt(numbers[1]) * 60 + parseInt(numbers[2]);
  
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.textContent = `${floor((time%(60*60*60))/(60*60))}:${formatTimeInt((time%(60*60))/60)}:${formatTimeInt(time%60)}`.replaceAll("NaN", "0");
  const img = document.createElement('img');
  img.src = icons['timer'];
  img.alt = '';
  resultEl.appendChild(img);
  if (!enter || isNaN(time) || time < 0 || time > 86400) return 'nothing';

  ipcRenderer.send('show-notification', { title: 'Timer', body: 'Started timer' });
  setTimeout(() => {
    ipcRenderer.send('show-notification', { title: 'Timer', body: 'Time is up' });
  }, time * 1000);
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
function RunWeather(enter) {
  //set Image
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.textContent = `Press enter to get the weather for ${getSearch().value.split("weather")[1].replaceAll(" ", "") == "" ? "your current location" : getSearch().value.split("weather")[1]}`;
  const img = document.createElement('img');
  img.src = icons['weather'];
  img.alt = '';
  resultEl.appendChild(img);
  if (enter) {
    let location = getSearch().value.split("weather")[1].replaceAll(" ", "+");
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}
getSearch().addEventListener('keyup', (e) => {
  if (e.key) {
    // TODO: calculator
    switch (userSelection()) {
      case 'calculator':
        RunCalculator(e.key === 'Enter');
        break;
      case 'converter':
        RunConverter();
        break;
      case 'timer':
        RunTimer(e.key === 'Enter');
        break;
      case 'weather':
        RunWeather(e.key === 'Enter');
        break;
      case 'nothing':
        switch (canDo()) {
          case 'calculator':
            RunCalculator(e.key === 'Enter');
            break;
          case 'converter':
            RunConverter();
            break;
          case 'nothing':
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
            break;
        }
        break;
    }
  }
});
});


var icons = {
  'calculator': '../static/images/calculator.svg',
  'converter': '../static/images/convert.svg',
  'timer': '../static/images/timer.svg',
  'weather': '../static/images/weather.svg',
  'search': '../static/images/wiki.svg',
  'nothing': '../static/images/nothing.png'
}

features = [
  "calculator",
  "timer",
  "converter",
  "weather",
  "search"
]
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
