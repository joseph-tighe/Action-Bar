const state = require('./state');

class Answer {
  constructor(imageUrl, text, overRideLimit=false) {
    this.text = text;
    let selector = false;
    if (document.getElementsByClassName('result').length > state.settings['answers']['max-amount'] && !overRideLimit) {
      return;
    } else if (document.getElementsByClassName('result').length == 0) {
      selector = true;
    }
    this.imageUrl = imageUrl;
    this.wrapper = document.createElement('div');
    state.getResults().appendChild(this.wrapper);
    this.wrapper.className = `resultWrapper${selector ? " selector" : ""}`;
    this.wrapper.innerHTML = '<div class="copy"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" /></svg></div>';
    this.resultEl = document.createElement('div');
    this.resultEl.className = "result";
    this.wrapper.appendChild(this.resultEl);
    this.resultEl.innerHTML = text;
    this.img = document.createElement('img');
    this.img.src = this.imageUrl;
    this.img.alt = '';
    this.resultEl.appendChild(this.img);
    let Index = document.getElementsByClassName('copy').length - 1;
    document.getElementsByClassName('copy')[Index].addEventListener('click', (e) => {
      if (state.activeFeatures[Index].copyFunction != undefined || state.activeFeatures[Index].copyFunction != null) {
        state.activeFeatures[Index].copyFunction(document.getElementsByClassName('result')[Index].textContent);
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
    try {
      this.wrapper.remove();
    } catch (e) {
      console.log(e);
    }
  }
  removeIcon() {
    this.resultEl.removeChild(this.img);
  }
  addIcon() {
    this.resultEl.appendChild(this.img);
  }
}
module.exports = { Answer };