const { contextBridge, ipcRenderer } = require('electron');

function getSearch() { return document.getElementById('search'); }

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
    return 'autocomplete';
  }
  return 'nothing';
}

var settingsLoaded = false;
var settings = {};
fetch("../config/settings.json").then(response => response.json()).then(data => {
  settings = data;
  settingsLoaded = true;
});
function loadAnswer(imageURL, result) {
  //TODO: Several answers in future
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.innerHTML = result;
  const img = document.createElement('img');
  img.src = imageURL;
  img.alt = '';
  resultEl.appendChild(img);
}
function callAction(e) {
  item = userSelection();
  hasGone = false;
  for (let i = 0; i < features.length; i++) {
    if (item === features[i]) {
      runFunctions[i](e.key);
      activeFeature = features[i];
      hasGone = true;
      break;
    }
  }
  if (!hasGone) {
    activeFeature = null;
    if (item === 'quit') {
      Quit();
      hasGone = true;
    } else if (item === 'autocomplete') {
      autocomplete(e.key);
      hasGone = true;
    }
  }
  if (!hasGone) {
    for (let i = 0; i < features.length; i++) {
      if (checkFunctions[i] != null && checkFunctions[i]()) {
        activeFeature = features[i];
        runFunctions[i](e.key);
        hasGone = true;
        break;
      }
    }
  }
  if (!hasGone) {
    if (getSearch().value.length > 0) {
      if (e.key === 'Enter') {
        runFunctions[features.indexOf(settings['defult-extention-onEnter'])](e.key);
        activeFeature = settings['defult-extention-onEnter'];
      } else {
        runFunctions[features.indexOf(settings['defult-extention'])](e.key);
        activeFeature = settings['defult-extention'];
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

ipcRenderer.on('focus-search', () => {
  getSearch().focus();
});

var activeFeature = null;
window.addEventListener('DOMContentLoaded', () => {
  document.getElementsByClassName('copy')[0].addEventListener('click', (e) => {
    console.log(copyFunctions[features.indexOf(activeFeature)], copyFunctions);
    console.log(features.indexOf(activeFeature));
    if (copyFunctions[features.indexOf(activeFeature)] != undefined || copyFunctions[features.indexOf(activeFeature)] != null) {
      copyFunctions[features.indexOf(activeFeature)]();
    } else {
      var x = document.getElementsByClassName('result')[0].textContent;
      navigator.clipboard.writeText(x);
    }

    document.getElementsByClassName('copy')[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path stroke="lime" fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
    setTimeout(() => {
      document.getElementsByClassName('copy')[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
    }, 1500);
  });
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

  getSearch().addEventListener('keyup', (e) => {
    if (e.key && e.key != "Escape") {
      callAction(e);
    } else if (e.key == "Escape") {
      ipcRenderer.send('close-window');
    }
  });
  setTimeout(async () => {
    while (!settingsLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    document.documentElement.style.setProperty('--background', settings['style']['background']);
    document.documentElement.style.setProperty('--foreground', settings['style']['foreground']);
    document.documentElement.style.setProperty('--borderradius', settings['style']['borderradius']);
    document.documentElement.style.setProperty('--shadowstrength', settings['style']['shadowstrength']);
    document.documentElement.style.setProperty('--answerbarwidth', settings['style']['answerbarwidth']);
    document.documentElement.style.setProperty('--searchwidth', settings['style']['searchwidth']);
    document.documentElement.style.setProperty('--bottomradius', parseFloat(settings['style']['answerbarwidth'].replace("%", "")) >= 99 ? '0px' : settings['style']['borderradius']);
    document.documentElement.style.setProperty('--expandability', (100 - parseFloat(settings['style']['expandability'].replace("%", ""))) / 100);
  }, 100);
});

function floor(x) {
  return Math.floor(x);
}
function formatTimeInt(x) {
  return floor(x).toString().padStart(2, "0");
}
var features = [];
var runFunctions = [];
var checkFunctions = [];
var copyFunctions = [];
function autocomplete(key) {
  const search = getSearch();
  var feat = "";
  for (const feature of features) {
    if (("@" + feature.toLowerCase()).includes(search.value.toLowerCase())) {
      feat = feature;
      break;
    }
  }
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.textContent = feat == "" ? "No results" : `@${feat}`;
  const img = document.createElement('img');
  img.src = "";
  img.alt = '';
  resultEl.appendChild(img);
  if (key === 'Enter' || key === 'Tab') {
    document.getElementById('search').value = `@${feat}`;
    callAction({key:null});
  }
}

//Load extentions
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
        "CheckFunction": ${data.CheckFunction},
        "copyFunction": ${data.copyFunction}
      }  
    })();`)
      features.push(data.name);
      console.log(feature);
      runFunctions.push(feature.RunFunction);
      checkFunctions.push(feature.CheckFunction);
      copyFunctions.push(feature.copyFunction);
    }
  }
})();