const { ipcRenderer } = require('electron');
const state = require('./preload/state');
require('./preload/Extension');
const { Search } = require('./preload/Search');
const { Answer } = require('./preload/Answer');
const { Pipeline } = require('./preload/pipeline');
const { autocomplete } = require('./preload/autocomplete');

fetch("../config/settings.json").then(response => response.json()).then(data => {
  state.settings = data;
  state.settingsLoaded = true;
});

function Quit() {
  ipcRenderer.send('quit');
}

function openSetting() {
  ipcRenderer.send('open-settings');
  state.getSearch().value = "";
}

function clearAnswers() {
  for (let i = 0; i < state.answerList.length; i++) {
    state.answerList[i].destroy();
  }
  state.answerList = [];
  const results = state.getResults();
  for (const child of results.children) {
    results.removeChild(child);
  }
}

function autocompleteEnter(answer) {
  clearAnswers();
  if (answer.getText() != "") {
    state.getSearch().value = answer.getText();
    state.getSearch().focus();
  }
  callAction({key:"a"});
}

function listExtentions() {
  for (var i = 0; i < state.features.length; i++) {
    let answer = new Answer("../static/images/icon.svg", state.settings["tool-decloration"]["tool-decloration-char"] + state.features[i].getName() + "    -    " + state.features[i].getDescription(), true);
    state.answerList.push(answer);
  }
}

function callActionWithAutocomplete(e) {
  if (state.getSearch().value[0] == state.settings['tool-decloration']['tool-decloration-char']) {
    didFind = autocomplete(e.key);
    if (didFind) {
      return;
    }
  }
  callAction(e);
}

function callAction(e) {
  let toCall = [];
  let search = new Search();
  for (let i = 0; i < state.features.length; i++) {
    if (state.features[i].canCall(search)) {
      toCall.push(state.features[i]);
    }
  }
  let priority = {"Explicit":0, "Checks Passed":1, "Default":2, "false":3};
  toCall.sort((a, b) => priority[a.howCall(search)] - priority[b.howCall(search)]);
  for (let i = 0; i < toCall.length; i++) {
    state.activeFeatures.push(toCall[i]);
    let answer = new Answer("../static/images/icon.svg", "Loading...");
    answer.setLoading(true);
    state.answerList.push(answer);
    toCall[i].run(e.key, answer, search);
  }
  if (search.getPrefix() == state.settings['tool-decloration']['tool-decloration-char'] + "settings") {
    openSetting();
  } else if (search.getPrefix() == state.settings['tool-decloration']['tool-decloration-char'] + "quit") {
    Quit();
  }
}

ipcRenderer.on('focus-search', () => {
  try {
    state.getSearch().focus();
  } catch (e) {
    console.log(e);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const start = Date.now();
  function waitForSearch() {
    const s = state.getSearch();
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
    const s = state.getSearch();
    if (!s) return;
    if (e.target.closest && e.target.closest('#search')) {
      e.preventDefault();
      s.blur();
      s.focus({ preventScroll: true });
    } else {
      s.click();
    }
  }, true);

  function manageSelector(e) {
    const wrappers = document.getElementsByClassName("resultWrapper");
    for (const i in state.settings["aliases"]["aliases"]) {
      if (state.getSearch().value.toLowerCase().includes(state.settings["aliases"]["aliases-char"] + i.toLowerCase())) {
        state.getSearch().value = state.getSearch().value.toLowerCase().replace(state.settings["aliases"]["aliases-char"] + i.toLowerCase(), state.settings["aliases"]["aliases"][i]);
      }
    }
    if (e.key === "ArrowUp") {
      if (wrappers.length === 0) return true;
      for (let i = 0; i < wrappers.length; i++) {
        if (wrappers[i].classList.contains("selector")) {
          wrappers[i].classList.remove("selector");
          wrappers[(i - 1 + wrappers.length) % wrappers.length].classList.add("selector");
          break;
        }
      }
      return true;
    }
    if (e.key === "ArrowDown") {
      if (wrappers.length === 0) return true;
      for (let i = 0; i < wrappers.length; i++) {
        if (wrappers[i].classList.contains("selector")) {
          wrappers[i].classList.remove("selector");
          wrappers[(i + 1) % wrappers.length].classList.add("selector");
          break;
        }
      }
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      if (wrappers.length === 0) return true;
      for (let i = 0; i < wrappers.length; i++) {
        if (wrappers[i].classList.contains("selector")) {
          if (state.activeFeatures.length === 0) {
            autocompleteEnter(state.answerList[i]);
          } else {
            state.activeFeatures[i].run(e.key, state.answerList[i], new Search());
          }
        }
      }
      return true;
    }
    return false;
  }

  state.getSearch().addEventListener('keyup', (e) => {
    let shouldReturn = manageSelector(e);
    if (shouldReturn) {
      return;
    }
    state.activeFeatures = []
    clearAnswers();
    let search = state.getSearch();
    if (search.value == "") {
      return;
    }
    if (e.key && !(e.key == "Enter" || e.key == "Tab" || e.key == "Escape" || e.key == "ArrowUp" || e.key == "ArrowDown" || search.value == "?")) {
      state.ResponseId++;
      callActionWithAutocomplete(e);
    }
    if (e.key === "Escape") {
      ipcRenderer.send('close-window');
      return;
    }
    if (search.value == "?") {
      listExtentions()
    }
    return;
  });

  setTimeout(async () => {
    while (!state.settingsLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    document.documentElement.style.setProperty('--background', state.settings['style']['background']);
    document.documentElement.style.setProperty('--foreground', state.settings['style']['foreground']);
    document.documentElement.style.setProperty('--borderradius', state.settings['style']['borderradius']);
    document.documentElement.style.setProperty('--shadowstrength', state.settings['style']['shadowstrength']);
    document.documentElement.style.setProperty('--answerbarwidth', state.settings['style']['answerbarwidth']);
    document.documentElement.style.setProperty('--searchwidth', state.settings['style']['searchwidth']);
    document.documentElement.style.setProperty('--bottomradius', parseFloat(state.settings['style']['answerbarwidth'].replace("%", "")) >= 99 ? '0px' : state.settings['style']['borderradius']);
    document.documentElement.style.setProperty('--expandability', (100 - parseFloat(state.settings['style']['expandability'].replace("%", ""))) / 100);
    if (state.settings['style']['tips']) {
      var placeholders = ["Search", "Try @Extention to call an extention", "Just type for your defult extentions"];
      var placeholderIndex = 1;
      setInterval(() => {
        if (search.value == "") {
          search.placeholder = placeholders[placeholderIndex];
          placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        }
      }, 6000);
    }
  }, 100);
  setInterval(() => {
    let results = document.getElementsByClassName("resultWrapper");
    if (results.length > 0) {
      for (let index = 0; index < results.length; index++) {
        if (results[index].classList.contains("selector")) {
          return;
        }
      }
      results[0].classList.add("selector");
    }
  }, 100);
});

(async () => {
  state.pipelines = await fetch("../src/pipelines/piplines.json").then(response => response.json());
})();

ipcRenderer.on('updateModal', (event, updateObj) => {
  const el = document.getElementById('update-status');
  if (!el) return;
  if (updateObj.error) {
    el.textContent = `Update error: ${updateObj.error}`;
    el.style.display = 'block';
  } else if (updateObj.isUpdateAvailable) {
    if (updateObj.isDownloading && !updateObj.isDone) {
      el.textContent = `Updating... ${Math.round(updateObj.progress)}%`;
      el.style.display = 'block';
    } else if (updateObj.isDone) {
      el.textContent = 'Update available — restart to install';
      el.style.display = 'block';
    }
  } else {
    el.style.display = 'none';
  }
});