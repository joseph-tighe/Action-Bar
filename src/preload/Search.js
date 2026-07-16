const state = require('./state');

class Search {
  constructor() {
    this.text = state.getSearch().value;
    this.prefix = this.text.split(" ")[0];
    if (this.prefix[0] == state.settings['tool-decloration']['tool-decloration-char']) {
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
    state.getSearch().value = text;
  }
  isRelevant() {
    return this.text == state.getSearch().value;
  }
}
module.exports = { Search };