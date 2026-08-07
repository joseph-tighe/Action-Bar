const state = require('./state');
const { Answer } = require('./Answer');
const { Search } = require('./Search');

/**
 * Represents the current search query state used to feed input to pipeline
 * feature functions. Wraps the raw text, an optional prefix, and the resolved
 * query string.
 */
class PipelineSearch {
  /**
   * Creates a PipelineSearch instance.
   * @param {string} text The raw search text.
   */
  constructor(text) {
    this.text = text;
    this.prefix = "";
    this.query = this.text;
  }
  /**
   * Returns the full raw search text.
   * @returns {string} The full text.
   */
  getFullText() {
    return this.text;
  }
  /**
   * Returns the search prefix.
   * @returns {string} The prefix.
   */
  getPrefix() {
    return this.prefix;
  }
  /**
   * Returns the resolved query string.
   * @returns {string} The query.
   */
  getQuery() {
    return this.query;
  }
  /**
   * Sets the search text and mirrors it into the app's search state.
   * @param {string} text The new search text.
   */
  setText(text) {
    this.text = text;
    state.getSearch().value = text;
  }
  /**
   * Checks whether this instance matches the currently active search value.
   * @returns {boolean} True if this text equals the current search value.
   */
  isRelevant() {
    return this.text == state.getSearch().value;
  }
}
/**
 * Represents an answer/result that a pipeline feature function is expected to
 * produce. Feature functions mutate this object's text and image so the
 * pipeline can read back the (possibly async) output.
 */
class PipelineAnswer {
  /**
   * Creates a PipelineAnswer instance.
   * @param {string} imageUrl The image URL for the result icon.
   * @param {string} text The initial result text.
   */
  constructor(imageUrl, text) {
    this.text = text;
    this.imageUrl = imageUrl;
    this.img = {src:null};
    this.wrapper = null;
  }
  /**
   * Returns the current result text.
   * @returns {string} The text.
   */
  getText() {
    return this.text;
  }
  /**
   * Returns the result image URL.
   * @returns {string} The image URL.
   */
  getImageUrl() {
    return this.imageUrl;
  }
  /**
   * Returns the DOM wrapper element, if any.
   * @returns {*} The wrapper element or null.
   */
  getWrapper() {
    return this.wrapper;
  }
  /**
   * Cleans up any resources held by this answer.
   */
  destroy() {
  }
  /**
   * Removes the result icon image from its element.
   */
  removeIcon() {
    this.resultEl.removeChild(this.img);
  }
  /**
   * Appends the result icon image to its element.
   */
  addIcon() {
    this.resultEl.appendChild(this.img);
  }
  /**
   * Updates the result text.
   * @param {string} text The new text.
   */
  updateText(text) {
    this.text = text;
  }
  /**
   * Updates the result image and refreshes the image source.
   * @param {string} imageUrl The new image URL.
   */
  updateImage(imageUrl) {
    this.imageUrl = imageUrl;
    this.img.src = imageUrl;
  }
}
/**
 * Executes a configured pipeline of instructions. Reads input from a source,
 * runs each step (join, bash, output, or feature function), and routes the
 * final result to the configured output.
 */
class Pipeline {
  /**
   * Creates a Pipeline from a pipeline definition object.
   * @param {Object} pipeline The pipeline definition.
   * @param {string} pipeline.name The pipeline name.
   * @param {string} pipeline.input The input source ("clipboard", "search" or "static").
   * @param {string} pipeline.output The output destination.
   * @param {Array} pipeline.steps The ordered list of instruction steps.
   */
  constructor (pipeline) {
    this.name = pipeline.name;
    this.input = pipeline.input;
    this.output = pipeline.output;
    this.instructions = pipeline.steps;
  }
  /**
   * Resolves the pipeline's configured input into a value.
   * @returns {Promise<string>} The resolved input value.
   * @throws {Error} If the input source is invalid.
   */
  resolveInput() {
    if (this.input === "clipboard") {
      return state.ipcRenderer.invoke('clipboard-read-text');
    }
    if (this.input === "search") {
      return state.getSearch().value;
    }
    if (this.input === "static") {
      return state.getSearch().value;
    }
    throw new Error("Invalid input");
  }
  /**
   * Routes a value to the pipeline's configured output destination.
   * @param {*} value The value to output.
   */
  Output(value = this.lastOutput) {
    if (value === undefined || value === null) return;

    switch (this.output) {
      case "clipboard":
        state.ipcRenderer.send('clipboard-write-text', value);
        break;
      case "answer":
        let answer = new Answer("../static/images/icon.svg", value);
        state.answerList.push(answer);
        break;
      case "search":
        state.getSearch().value = value;
        break;
      case "null":
        break;
      default:
        throw new Error("Invalid output");
    }
  }
  /**
   * Reserved for running instructions in sequence (currently unused).
   */
  runInstructions() {

  }
  /**
   * Runs the full pipeline: resolves input, executes each instruction step,
   * then emits the final output if none was emitted during the run.
   * @returns {Promise<void>}
   */
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
        const bashOutput = await state.ipcRenderer.invoke('run-bash', normalizedCommand);
        this.outputs[instruction.id] = bashOutput;
        this.lastOutput = this.outputs[instruction.id];
      } else if (instruction.action === "output") {
        this.outputs[instruction.id] = X[0];
        this.lastOutput = this.outputs[instruction.id];
        this.Output(this.lastOutput);
        emitted = true;
      } else {
        const isAsync = fn => fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
        let fakeOutput = new PipelineAnswer("../static/images/icon.svg", "");
        let fakeSearch = new PipelineSearch(X[0]);
        const fn = state.runFunctions[state.features.indexOf(instruction.action)];
        if (isAsync(fn)) {
          await fn("a", fakeOutput, fakeSearch);
        } else {
          fn("a", fakeOutput, fakeSearch);
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

/**
 * Finds a pipeline definition by its name.
 * @param {string} name The pipeline name to look up.
 * @returns {Object|null} The matching pipeline definition, or null if not found.
 */
function getPipeline(name) {
  for (const pipeline of state.pipelines) {
    if (pipeline.name === name) {
      return pipeline;
    }
  }
  return null;
}
/**
 * Invokes the enabled pipeline whose trigger is "with <feature>". Only acts on
 * the first matching enabled pipeline and runs it asynchronously.
 * @param {string} feature The feature name to trigger on.
 */
function callPipeWith(feature) {
  for (const pipe of state.pipelines) {
    if (pipe.trigger.split(" ")[0] == "with" && pipe.trigger.split(" ")[1] == feature && pipe.enabled) {
      const x = new Pipeline(pipe);
      x.run().catch((error) => console.error("Pipeline failed:", error));
      return;
    }
  }
}
module.exports = { PipelineSearch, PipelineAnswer, Pipeline, getPipeline, callPipeWith };