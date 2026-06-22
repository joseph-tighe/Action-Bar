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

function RunCalculator(key) {
  if (canCalculate()) {
    equation = getSearch().value;
    setNext = false;
    if (equation.includes("=") || (key === 'Enter' || key === 'Tab')) {
      equation = equation.replace("=", "");
      setNext = true;
    }
    equation = equation.replaceAll("^", "**");
    const result = eval(equation);
    loadAnswer(icons['calculator'], result);
    if (setNext) {
      getSearch().value = result;
      getSearch().focus();
    }
  }
}