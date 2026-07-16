const state = require('./state');
const { Answer } = require('./Answer');
const { Search } = require('./Search');

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
    state.getSearch().value = text;
  }
  isRelevant() {
    return this.text == state.getSearch().value;
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
      return state.getSearch().value;
    }
    if (this.input === "static") {
      return state.getSearch().value;
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

function getPipeline(name) {
  for (const pipeline of state.pipelines) {
    if (pipeline.name === name) {
      return pipeline;
    }
  }
  return null;
}
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