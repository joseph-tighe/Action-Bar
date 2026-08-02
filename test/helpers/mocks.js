function createSearch(initialQuery) {
  let query = initialQuery ?? '';
  return {
    getQuery: () => query,
    getFullText: () => query,
    getPrefix: () => '',
    setText: (text) => { query = String(text); },
    isRelevant: () => true
  };
}

function createAnswer() {
  const answer = {
    text: '',
    image: '',
    destroyed: false,
    updateText: (text) => { answer.text = String(text); },
    updateImage: (image) => { answer.image = String(image); },
    getText: () => answer.text,
    getImageUrl: () => answer.image,
    getWrapper: () => answer,
    destroy: () => { answer.destroyed = true; },
    removeIcon: () => {},
    addIcon: () => {},
    setLoading: () => {},
    img: {}
  };
  return answer;
}

function createIpcRenderer() {
  const sent = [];
  const invoked = {};
  return {
    sent,
    invoked,
    send: (channel, ...args) => { sent.push([channel, ...args]); },
    on: () => {},
    invoke: async (channel, ...args) => { invoked[channel] = args; return null; }
  };
}

module.exports = { createSearch, createAnswer, createIpcRenderer };
