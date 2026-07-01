const { contextBridge, ipcRenderer } = require('electron');

//Load settings
var settingsLoaded = false;
var settings = {};
var activeFeatures = [];
var features = [];
var runFunctions = [];
var checkFunctions = [];
var copyFunctions = [];
var ResponseId = 0;
var hasDone = false;
var answerList = [];
var pipelines = [];
class Search {
  constructor() {
    this.text = getSearch().value;
    this.prefix = this.text.split(" ")[0];
    if (this.prefix[0] == settings['tool-decloration']['tool-decloration-char']) {
      this.query = this.text.split(" ").splice(1).join(" ");
    } else {
      this.prefix = "";
      this.query = this.text;
    }
  }
  getFullText() {
    return this.text;
  }
  getPrefix() {
    return this.prefix;
  }
  getQuery() {
    return this.query;
  }
  setText(text) {
    this.text = text;
    getSearch().value = text;
  }
  isRelevant() {
    return this.text == getSearch().value;
  }
}
class Answer {
  constructor(imageUrl, text) {
    this.text = text;
    let selector = false;
    if (document.getElementsByClassName('result').length > settings['answers']['max-amount']) {
      return;
    } else if (document.getElementsByClassName('result').length == 0) {
      selector = true;
    }
    this.imageUrl = imageUrl;
    this.wrapper = document.createElement('div');
    results.appendChild(this.wrapper);
    this.wrapper.className = `resultWrapper${selector ? " selector" : ""}`;
    this.wrapper.innerHTML = '<div class="copy"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" /></svg></div>';
    this.resultEl = document.createElement('div');
    this.resultEl.className = "result";
    this.wrapper.appendChild(this.resultEl);
    this.resultEl.innerHTML = text;
    this.img = document.createElement('img');
    this.img.src = this.imageUrl;
    this.img.alt = '';0
    this.resultEl.appendChild(this.img);
    let Index = document.getElementsByClassName('copy').length - 1;
    document.getElementsByClassName('copy')[Index].addEventListener('click', (e) => {
      if (copyFunctions[features.indexOf(activeFeatures[Index])] != undefined || copyFunctions[features.indexOf(activeFeatures[Index])] != null) {
        copyFunctions[features.indexOf(activeFeatures[Index])](document.getElementsByClassName('result')[Index].textContent);
      } else {
        var x = document.getElementsByClassName('result')[Index].textContent;
        navigator.clipboard.writeText(x);
      }

      document.getElementsByClassName('copy')[Index].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path stroke="lime" fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
      setTimeout(() => {
        document.getElementsByClassName('copy')[Index].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
      }, 1500);
    });
  }
  setLoading(istrue) {
  if (istrue) {
    this.resultEl.innerHTML = '';
    this.loader = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.loader.setAttribute('class', 'loader');
    this.loader.setAttribute('viewBox', '0 0 16 16');
    this.loader.setAttribute('width', '20');
    this.loader.setAttribute('height', '20');
    this.loader.setAttribute('aria-label', 'Loading');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '8');
    circle.setAttribute('cy', '8');
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#0877d1');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('stroke-linecap', 'round');
    //circle.setAttribute('stroke-dasharray', '24 16');

    this.loader.appendChild(circle);
    this.resultEl.appendChild(this.loader);
  } else {
    this.resultEl.innerHTML = this.text;
  }
}
  updateText(text) {
    this.setLoading(false);
    this.text = text;
    this.resultEl.innerHTML = text;
    this.resultEl.appendChild(this.img);
  }
  updateImage(imageUrl) {
    this.imageUrl = imageUrl;
    this.img.src = imageUrl;
  }
  getText() {
    return this.text;
  }
  getImageUrl() {
    return this.imageUrl;
  }
  getWrapper() {
    return this.wrapper;
  }
  destroy() {
    this.wrapper.remove();
  }
  removeIcon() {
    this.resultEl.removeChild(this.img);
  }
  addIcon() {
    this.resultEl.appendChild(this.img);
  }
}
class PipelineSearch {
  constructor(text) {
    this.text = text;
    this.prefix = "";
    this.query = this.text;
  }
  getFullText() {
    return this.text;
  }
  getPrefix() {
    return this.prefix;
  }
  getQuery() {
    return this.query;
  }
  setText(text) {
    this.text = text;
    getSearch().value = text;
  }
  isRelevant() {
    return this.text == getSearch().value;
  }
}
class PipelineAnswer {
  constructor(imageUrl, text) {
    this.text = text;
    this.imageUrl = imageUrl;
    this.img = {src:null};
    this.wrapper = null;
  }
  getText() {
    return this.text;
  }
  getImageUrl() {
    return this.imageUrl;
  }
  getWrapper() {
    return this.wrapper;
  }
  destroy() {
    this.wrapper.remove();
  }
  removeIcon() {
    this.resultEl.removeChild(this.img);
  }
  addIcon() {
    this.resultEl.appendChild(this.img);
  }
  updateText(text) {
    this.text = text;
  }
  updateImage(imageUrl) {
    this.imageUrl = imageUrl;
    this.img.src = imageUrl;
  }
}

fetch("../config/settings.json").then(response => response.json()).then(data => {
  settings = data;
  settingsLoaded = true;
});

function Quit() {
  window.close();
}

function openSetting() {
  ipcRenderer.send('open-settings');
  getSearch().value = "";
}

function getSearch() { return document.getElementById('search'); }

const isAsync = fn => fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
function callPipeWith(feature) {
  for (const pipe of pipelines) {
    if (pipe.trigger.split(" ")[0] == "with" && pipe.trigger.split(" ")[1] == feature) {
      const x = new Pipeline(pipe);
      x.run().catch((error) => console.error("Pipeline failed:", error));
      return;
    }
  }
}
function userSelection() {
  if (!settings['tool-decloration']['tool-declorable']) return 'nothing';
  value = getSearch().value.toLowerCase();
  if (value[0] == settings['tool-decloration']['tool-decloration-char']) {
    for (feature of features) {
      if (value.split(" ")[0].includes(feature.toLowerCase())) {
        return feature;
      }
    }
    if (value.split(" ")[0].includes("quit")) {
      return 'quit';
    } else if (value.split(" ")[0].includes("settings")) {
      return 'settings';
    }
    return 'autocomplete';
  } else if (value[0] == settings['pipelines']['noting-char']) {
    for (const key in pipelines) {
      let pipe = pipelines[key];
      if (value.split(" ")[0].includes(pipe.name.toLowerCase())) {
        return pipe.name;
      }
    }
    return 'autocomplete';
  }
  return 'nothing';
}
function callActionUserSelection(item, hasGone, e) {
  for (let i = 0; i < features.length; i++) {
    if (item === features[i]) {
      activeFeatures.push(features[i]);
      let answer = new Answer("../static/images/icon.svg", "Loading...");
      answerList.push(answer);
      runFunctions[i](e.key, answer, new Search());
      callPipeWith(features[i]);
      return true;
    }
  }
  if (!hasGone) {
    if (item === 'quit') {
      Quit();
      return true;
    } else if (item === 'settings') {
      openSetting();
      return true;
    } if (item === 'autocomplete') {
      autocomplete(e.key);
      
      return true;
    }
  }
  return hasGone;
}
function callActionCheck(item, hasGone, e) {
  if (!hasGone) {
    for (let i = 0; i < features.length; i++) {
      if (checkFunctions[i] != null && checkFunctions[i]()) {
        activeFeatures.push(features[i]);
        let answer = new Answer("../static/images/icon.svg", "Loading...");
        answerList.push(answer);
        runFunctions[i](e.key, answer, new Search());
        callPipeWith(features[i]);
        return true;
      }
    }
  }
  return hasGone;
}
function callActionDefult(item, hasGone, e) {
  if (!hasGone) {
    if (getSearch().value.length > 0) {
      for (let i = 0; i < settings["extensions"]['defult-extentions'].length; i++) {
        let answer = new Answer("../static/images/icon.svg", "Loading...");
        answer.setLoading(true);
        answerList.push(answer);
        runFunctions[features.indexOf(settings["extensions"]['defult-extentions'][i])](e.key, answer, new Search());
        callPipeWith(settings["extensions"]['defult-extentions'][i]);
        activeFeatures.push(settings["extensions"]['defult-extentions'][i]);
      }
    } else {
      const results = document.getElementById('results');
      for (const child of results.children) {
        results.removeChild(child);
      }
    }
  }
}
function callAction(e) {
  var item = userSelection();
  for (let i = 0; i < answerList.length; i++) {
    answerList[i].destroy();
  }
  answerList = [];
  var hasGone = false;
  hasGone = callActionUserSelection(item, hasGone, e);
  callActionCheck(item, hasGone, e);
  callActionDefult(item, hasGone, e);
}

ipcRenderer.on('focus-search', () => {
  getSearch().focus();
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

getSearch().addEventListener('keyup', (e) => {
  const wrappers = document.getElementsByClassName("resultWrapper");

  if (e.key === "Escape") {
    ipcRenderer.send('close-window');
    return;
  }

  
  search = getSearch();
  if (search.value[0] == (settings['pipelines']['noting-char'])) {
    if (e.key === 'Enter') {
      name = search.value.split(settings['pipelines']['noting-char'])[1];
      for (const pipe in pipelines) {
        if (pipelines[pipe].name == name && pipelines[pipe].trigger == "call") {
          x = new Pipeline(pipelines[pipe]);
          x.run();
          return;
        }
      }
    }
  }

  if (e.key === "Enter" || e.key === "Tab") {
    if (wrappers.length === 0) return;

    for (let i = 0; i < wrappers.length; i++) {
      if (wrappers[i].classList.contains("selector")) {
        if (activeFeatures.length === 0) {
          autocompleteEnter(answerList[i]);
        } else {
          runFunctions[features.indexOf(activeFeatures[i])](e.key, answerList[i], new Search());
          callPipeWith(activeFeatures[i]);
        }
      }
    }
    return;
  }

  if (e.key === "ArrowUp") {
    if (wrappers.length === 0) return;

    for (let i = 0; i < wrappers.length; i++) {
      if (wrappers[i].classList.contains("selector")) {
        wrappers[i].classList.remove("selector");
        wrappers[(i - 1 + wrappers.length) % wrappers.length].classList.add("selector");
        break;
      }
    }
    return;
  }

  if (e.key === "ArrowDown") {
    if (wrappers.length === 0) return;

    for (let i = 0; i < wrappers.length; i++) {
      if (wrappers[i].classList.contains("selector")) {
        wrappers[i].classList.remove("selector");
        wrappers[(i + 1) % wrappers.length].classList.add("selector");
        break;
      }
    }
    return;
  }
  activeFeatures = []
  if (e.key) {
    ResponseId++;
    hasDone = false;
    callAction(e);
  }
  
  if (settings['style']['tips']) {
    var placeholders = ["Search", "Try @Extention to call an extention", "Just type for your defult extentions"];
    var placeholderIndex = 1;

    setInterval(() => {
      if (search.value == "") {
        search.placeholder = placeholders[placeholderIndex];
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
      }
    }, 6000);
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
function autocompleteEnter(answer) {
  if (answer.getText() != "") {
    getSearch().value = answer.getText();
    getSearch().focus();
  }
  callAction({key:"a"});
  
}
function autocomplete(pressedKey) {
  const search = getSearch();
  var feats = [];
  for (const feature of features) {
    if ((settings['tool-decloration']['tool-decloration-char'] + feature.toLowerCase()).includes(search.value.toLowerCase())) {
      feats.push(feature);
    }
  }
  if ((settings['tool-decloration']['tool-decloration-char'] + "settings").includes(search.value.toLowerCase())) {
    feats.push("settings");
  } else if ((settings['tool-decloration']['tool-decloration-char'] + "quit").includes(search.value.toLowerCase())) {
    feats.push("quit");
  }
  for (const pipe of pipelines) {
    if (pipe.trigger == "call" && (settings['pipelines']['noting-char'] + pipe.name.toLowerCase()).includes(search.value.toLowerCase())) {
      feats.push(settings['pipelines']['noting-char'] + pipe.name);
    }
  }
  c = 0;
  for (const feat of feats) {
    let answer = new Answer("../static/images/icon.svg", feat == "" ? "No results" : `${settings['pipelines']['noting-char'] != feat[0] ? settings['tool-decloration']['tool-decloration-char'] : settings['pipelines']['noting-char']}${feat[0] == settings['pipelines']['noting-char'] ? feat.slice(1) : feat}`);
    answerList.push(answer);
    c++;
    if (c == settings["answers"]["max-amount"]) break;
  }
}

//Load extentions
ipcRenderer.send('get-extentions');

ipcRenderer.on('get-extentions', (event, files) => {
  (async () => {
  manifests = {};
  for (const file of files) {
    let data = await fetch(`../src/extentions/${file}/manifest.json`).then(response => response.json());
    manifests[file] = data;
  }
  for (const file of files) {
    let data = manifests[file];
    if (data.settings.active) {
      let code = await fetch(`../src/extentions/${file}/${data.file}`).then(response => response.text());
      eval(code); //make functions
      let feature = eval(`(() => {
      return {
        "RunFunction": ${data.RunFunction},
        "CheckFunction": ${data.CheckFunction},
        "copyFunction": ${data.copyFunction}
      }  
    })();`);
      features.push(data.name.toLowerCase());
      runFunctions.push(feature.RunFunction);
      checkFunctions.push(feature.CheckFunction);
      copyFunctions.push(feature.copyFunction);
    }
  }
})();
});
(async () => {
  pipelines = await fetch("../src/pipelines/piplines.json").then(response => response.json());
})();
function getPipeline(name) {
  for (const pipeline of pipelines) {
    if (pipeline.name === name) {
      return pipeline;
    }
  }
  return null;
}
class Pipeline {
  constructor (pipeline) {
    this.name = pipeline.name;
    this.input = pipeline.input;
    this.output = pipeline.output;
    this.instructions = pipeline.steps;
  }
  resolveInput() {
    if (this.input === "clipboard") {
      return navigator.clipboard.readText();
    }
    if (this.input === "search") {
      return getSearch().value;
    }
    if (this.input === "static") {
      return getSearch().value;
    }
    throw new Error("Invalid input");
  }
  Output(value = this.lastOutput) {
    if (value === undefined || value === null) return;

    switch (this.output) {
      case "clipboard":
        navigator.clipboard.writeText(value);
        break;
      case "answer":
        let answer = new Answer("../static/images/icon.svg", value);
        answerList.push(answer);
        break;
      case "search":
        getSearch().value = value;
        break;
      case "null":
        break;
      default:
        throw new Error("Invalid output");
    }
  }
  runInstructions() {

  }
  async run() {
    const input = await this.resolveInput();
    this.outputs = { input };
    this.lastOutput = input;
    let emitted = false;

    for (const instruction of this.instructions) {
      const X = [];
      for (const instructionInput of instruction.inputs) {
        if (instructionInput.step !== undefined) {
          X.push(this.outputs[instructionInput.step]);
        } else {
          X.push(instructionInput);
        }
      }

      if (instruction.action === "join") {
        this.outputs[instruction.id] = X.join("");
        this.lastOutput = this.outputs[instruction.id];
      } else if (instruction.action === "bash") {
        const commandText = typeof X[0] === 'string' ? X[0] : String(X[0] ?? '');
        const normalizedCommand = commandText.trim().replace(/^\$\s*/, '');
        const bashOutput = await ipcRenderer.invoke('run-bash', normalizedCommand);
        this.outputs[instruction.id] = bashOutput;
        this.lastOutput = this.outputs[instruction.id];
      } else if (instruction.action === "output") {
        this.outputs[instruction.id] = X[0];
        this.lastOutput = this.outputs[instruction.id];
        this.Output(this.lastOutput);
        emitted = true;
      } else {
        let fakeOutput = new PipelineAnswer("../static/images/icon.svg", "");
        let fakeSearch = new PipelineSearch(X[0]);
        if (isAsync(runFunctions[features.indexOf(instruction.action)])) {
          await runFunctions[features.indexOf(instruction.action)]("a", fakeOutput, fakeSearch);
        } else {
          runFunctions[features.indexOf(instruction.action)]("a", fakeOutput, fakeSearch);
        }

        const featureOutput = fakeOutput.getText();
        const fallbackValue = typeof X[0] === 'string' ? X[0] : '';
        const resolvedOutput = featureOutput && !/^(Loading\.\.\.|No results|Press enter to open)$/.test(featureOutput)
          ? featureOutput
          : fallbackValue;

        this.outputs[instruction.id] = resolvedOutput;
        this.lastOutput = this.outputs[instruction.id];
      }
    }

    if (!emitted) {
      this.Output(this.lastOutput);
    }
  }
}