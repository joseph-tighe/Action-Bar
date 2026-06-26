function canCalculate() {
  let search = new Search();
  let isNumericChar = null;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of search.getQuery()) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? 'calculator' : null;
    if (isNumericChar) {
      
    } else {
      break;
    }
  }
  return isNumericChar;
}
function canCalculateWithInput(search) {
  let isNumericChar = false;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of search.getQuery()) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? 'calculator' : null;
    if (isNumericChar) {
      
    } else {
      break;
    }
  }
  return isNumericChar;
}

function RunCalculator(key, output, search) {
  if (canCalculateWithInput(search)) {
    output.updateImage("extentions/calculator/calculator.svg");
    equation = search.getQuery();
    setNext = false;
    if (equation.includes("=") || (key === 'Enter' || key === 'Tab')) {
      equation = equation.replace("=", "");
      setNext = true;
    }
    equation = equation.replaceAll("^", "**");
    const result = eval(equation);
    output.updateText(result);
    if (setNext) {
      search.setText(result);
    }
  }
}