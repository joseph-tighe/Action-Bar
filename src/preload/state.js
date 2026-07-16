const { ipcRenderer } = require('electron');

module.exports = {
  settingsLoaded: false,
  settings: {},
  activeFeatures: [],
  features: [],
  runFunctions: [],
  ResponseId: 0,
  answerList: [],
  pipelines: [],
  getSearch() { return document.getElementById('search'); },
  getResults() { return document.getElementById('results'); },
  ipcRenderer
};