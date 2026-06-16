window.addEventListener('DOMContentLoaded', () => {
function getSearch() { return document.getElementById('search'); }

const start = Date.now();
function waitForSearch() {
const s = getSearch();
if (s) {
s.click();
return;
}
if (Date.now() - start < 5000) {
requestAnimationFrame(waitForSearch);
}
}
waitForSearch();

document.addEventListener('click', (e) => {
const s = getSearch();
if (!s) return;
if (e.target.closest && e.target.closest('#search')) {
e.preventDefault();
s.blur();
s.focus({ preventScroll: true });
} else {
s.click();
}
}, true);
function canCalculate() {
  s = getSearch().value;
  let isNumericChar = null;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of s) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? 'calculator' : null;
    if (isNumericChar) {
      
    } else {
      break;
    }
  }
  return isNumericChar;
}
function canDo() {
  const s = getSearch().value;
  if (s.length === 0) return 'nothing';
  
  if (canCalculate()) {
    return 'calculator';
  }
  //TODO: Implement more features
  return 'nothing';
}
function RunCalculator() {
  if (canCalculate()) {
    equation = getSearch().value;
    setNext = false;
    if (equation.includes("=")) {
      equation = equation.replace("=", "");
      setNext = true;
    }
    equation.replaceAll("^", "**");
    const result = eval(equation);
    const resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = result; // for text part
    const img = document.createElement('img');
    img.src = icons['calculator'];
    img.alt = 'calculator';
    resultEl.appendChild(img);
    if (setNext) {
      getSearch().value = result;
      getSearch().focus();
    }
  }
}
getSearch().addEventListener('keyup', (e) => {
  console.log(e);
  if (e.key === 'Enter') {
    // TODO: Launch app
  } else {
    // TODO: calculator
    switch (canDo()) {
      case 'calculator':
        RunCalculator();
        break;
      case 'nothing':
        break;
    }
  }
});
});


var icons = {
  'calculator': '../static/images/calculator.svg',
  'nothing': '../static/images/nothing.png'
}