const { PipelineAnswer, PipelineSearch } = require('./pipeline');
const state = require('./state');

/**
 * A class for an extension
 */
class Extention {
  /**
   * The constructor for the extension class
   * @param {string} name The name of the extension the user uses to call it
   * @param {string} description A description of the extension
   * @param {Function} runFunction The function that is called when calling your extension
   * @param {Function | undefined | null} checkFunction The function used to check if the current conditions allow for the extension to be called
   * @param {Function | undefined | null} copyFunction The function used to copy the answer to the users clipboard
   * @param {boolean} isDefualt Is this extension set as a defullt extension
   */
  constructor(name, description, runFunction, checkFunction, copyFunction, isDefualt) {
    this.name = name
    this.handler = runFunction
    this.checkFunction = checkFunction
    this.copyFunction = copyFunction
    this.isDefualt = isDefualt;
    if (this.copyFunction == null || this.copyFunction == undefined) {
      this.copyFunction = function(text) {
        state.ipcRenderer.send('clipboard-write-text', text);
      }
    }
    this.description = description;
  }
  /**
   * Get the description of the extension
   * @returns {string} description
   */
  getDescription() {
    return this.description;
  }
  /**
   * Get the name of the extension
   * @returns {string} the name
   */
  getName() {
    return this.name;
  }
  /**
   * run the extention
   * @param {string} key The key last pressed
   * @param {Answer|PipelineAnswer} answer The assigned answer
   * @param {Search|PipelineSearch} search The current search
   */
  run(key, answer, search) {
    this.handler(key, answer, search);
  }
  /**
   * check if it can be called
   * @param {Search} search The current search
   * @returns 
   */
  check(search) {
    return this.checkFunction(search);
  }
  /**
   * copy it
   * @param {string} text 
   */
  copy(text) {
    this.copyFunction(text);
  }
  /**
   * try to run the extension
   * @param {string} key the key last pressed
   * @param {Answer|PipelineAnswer} answer The assigned answer (will be destroyed if run fails)
   * @param {Search|PipelineSearch} search The current search
   */
  TryRun(key, answer, search) {
    if (this.canCall(search)) {
      this.handler(key, answer, search);
    } else {
      answer.destroy();
    }
  }
  /**
   * Check if the extension can be called
   * @param {Search|PipelineSearch} search The current search
   * @returns {boolean} whether the extension can be called
   */
  canCall(search) {
    return this.howCall(search) != "false";
  }
  /**
   * Check by which method the extension can be called
   * @param {Search|PipelineSearch} search The current search
   * @returns {string} the method by which the extension can be called
   */
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
/**
 * Initializes the extentions
 */
function initExtentions() {
  state.ipcRenderer.send('get-extentions');
}

state.ipcRenderer.on('get-extentions', (event, files) => {
  (async () => {
  var manifests = {};
  for (const file of files) {
    let data = await state.ipcRenderer.invoke('get-extention-manifest', file);
    manifests[file] = data;
  }
  for (const file of files) {
    let data = manifests[file];
    if (data && data.settings && data.settings.active) {
      let code = await state.ipcRenderer.invoke('get-extention-code', file, data.file);
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