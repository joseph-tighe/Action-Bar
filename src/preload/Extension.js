const state = require('./state');

class Extention {
  constructor(name, description, runFunction, checkFunction, copyFunction, isDefualt) {
    this.name = name
    this.handler = runFunction
    this.checkFunction = checkFunction
    this.copyFunction = copyFunction
    this.isDefualt = isDefualt;
    if (this.copyFunction == null) {
      this.copyFunction = function(text) {
        navigator.clipboard.writeText(text);
      }
    }
    this.description = description;
  }
  getDescription() {
    return this.description;
  }
  getName() {
    return this.name;
  }
  run(key, answer, search) {
    this.handler(key, answer, search);
  }
  check(search) {
    return this.checkFunction(search);
  }
  copy(text) {
    this.copyFunction(text);
  }
  TryRun(key, answer, search) {
    if (this.canCall(search)) {
      this.handler(key, answer, search);
    } else {
      answer.destroy();
    }
  }
  canCall(search) {
    return this.howCall(search) != "false";
  }
  howCall(search) {
     if (search.getPrefix() == state.settings['tool-decloration']['tool-decloration-char'] + this.name) {
      return "Explicit"
    } else if (this.checkFunction != null && this.checkFunction != undefined && this.checkFunction(search)) {
      return "Checks Passed"
    } else if (this.isDefualt) {
      return "Default"
    } else {
      return "false";
    }
  }
}

function initExtentions() {
  state.ipcRenderer.send('get-extentions');
}

state.ipcRenderer.on('get-extentions', (event, files) => {
  (async () => {
  var manifests = {};
  for (const file of files) {
    let data = await fetch(`../src/extentions/${file}/manifest.json`).then(response => response.json());
    manifests[file] = data;
  }
  for (const file of files) {
    let data = manifests[file];
    if (data.settings.active) {
      let code = await fetch(`../src/extentions/${file}/${data.file}`).then(response => response.text());
      const ipcRenderer = state.ipcRenderer;
      eval(code);
      let feature = eval(`(() => {
      return {
        "RunFunction": ${data.RunFunction},
        "CheckFunction": ${data.CheckFunction},
        "copyFunction": ${data.copyFunction}
      }
    })();`);
      if (state.settings['extensions']['defult-extentions'].includes(data.name)) {
        state.features.push(new Extention(data.name, manifests[file].metadata.description, feature.RunFunction, feature.CheckFunction, feature.copyFunction, true));
      } else {
        state.features.push(new Extention(data.name, manifests[file].metadata.description, feature.RunFunction, feature.CheckFunction, feature.copyFunction, false));
      }
    }
  }
  //move open to front
  state.features.sort((a, b) => a.name == "open" ? -1 : b.name == "open" ? 1 : 0);
})();
});

initExtentions();
module.exports = { Extention, initExtentions };