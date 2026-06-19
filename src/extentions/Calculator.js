function canCalculate() {
  var s;
  //set Image
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    s = values.join(" ");
  } else {
    s = getSearch().value;
  }
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

function RunCalculator(enter) {
  if (canCalculate()) {
    equation = getSearch().value;
    setNext = false;
    if (equation.includes("=") || enter) {
      equation = equation.replace("=", "");
      setNext = true;
    }
    equation = equation.replaceAll("^", "**");
    const result = eval(equation);
    const resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = result; // for text part
    const img = document.createElement('img');
    img.src = icons['calculator'];
    img.alt = '';
    resultEl.appendChild(img);
    if (setNext) {
      getSearch().value = result;
      getSearch().focus();
    }
  }
}