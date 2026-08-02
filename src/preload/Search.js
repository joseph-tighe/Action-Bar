const state = require('./state');
/**
 * Represents the search input
 */
class Search {
  /**
   * The constructor for the search class
   */
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
  /**
   * gets the text of the search bar
   * @returns the raw text of the search bar
   */
  getFullText() {
    return this.text;
  }
  /**
   * Gets the prefix of the search
   * @returns the prefix if any of the search (EX: @calculator)
   */
  getPrefix() {
    return this.prefix;
  }
  /**
   * Gets the query
   * @returns the query of the search (rawText - prefix)
   */
  getQuery() {
    return this.query;
  }
  /**
   * sets the text of the search bar
   * @param {string} text the new text
   */
  setText(text) {
    this.text = text;
    state.getSearch().value = text;
  }
  /**
   * is this class still up to date
   * @returns {boolean} false if the user has changed the contents of the search bar after this class was made
   */
  isRelevant() {
    return this.text == state.getSearch().value;
  }
}
module.exports = { Search };