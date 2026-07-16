const state = require('./state');
const { Answer } = require('./Answer');

function autocomplete(pressedKey) {
  const search = state.getSearch();
  var feats = [];
  for (const feature of state.features) {
    if ((state.settings['tool-decloration']['tool-decloration-char'] + feature.getName().toLowerCase()).includes(search.value.toLowerCase())) {
      feats.push(feature.getName());
    }
  }
  if ((state.settings['tool-decloration']['tool-decloration-char'] + "settings").includes(search.value.toLowerCase())) {
    feats.push("settings");
  } else if ((state.settings['tool-decloration']['tool-decloration-char'] + "quit").includes(search.value.toLowerCase())) {
    feats.push("quit");
  }
  for (const pipe of state.pipelines) {
    if (pipe.trigger == "call" && (state.settings['pipelines']['noting-char'] + pipe.name.toLowerCase()).includes(search.value.toLowerCase())) {
      feats.push(state.settings['pipelines']['noting-char'] + pipe.name);
    }
  }
  c = 0;
  for (const feat of feats) {
    let answer = new Answer("../static/images/icon.svg", feat == "" ? "No results" : `${state.settings['pipelines']['noting-char'] != feat[0] ? state.settings['tool-decloration']['tool-decloration-char'] : state.settings['pipelines']['noting-char']}${feat[0] == state.settings['pipelines']['noting-char'] ? feat.slice(1) : feat}`);
    state.answerList.push(answer);
    c++;
    if (c == state.settings["answers"]["max-amount"]) break;
  }
  return feats.length != 0;
}

module.exports = { autocomplete };