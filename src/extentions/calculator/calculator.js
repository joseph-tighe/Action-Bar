function canCalculate() {
  let search = new Search();
  let text = search.getQuery();
  text = text.replaceAll("deg", "");
  text = text.replaceAll("e", "");
  text = text.replaceAll("tau", "");
  text = text.replaceAll("phi", "");
  text = text.replaceAll("pi", "");
  text = text.replaceAll("rad", "");
  text = text.replaceAll("sin", "");
  text = text.replaceAll("cos", "");
  text = text.replaceAll("tan", "");
  text = text.replaceAll("sqrt", "");
  let isNumericChar = false;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of text) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? true : false;
    if (!isNumericChar) {
      break;
    }
  }
  return isNumericChar;
}
function canCalculateWithInput(search) {
  let text = search.getQuery();
  text = text.replaceAll("deg", "");
  text = text.replaceAll("e", "");
  text = text.replaceAll("tau", "");
  text = text.replaceAll("phi", "");
  text = text.replaceAll("pi", "");
  text = text.replaceAll("rad", "");
  text = text.replaceAll("sin", "");
  text = text.replaceAll("cos", "");
  text = text.replaceAll("tan", "");
  text = text.replaceAll("sqrt", "");
  let isNumericChar = false;
  const numericChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '%', '.', ',', '^', '(', ')'];
  for (item of text) {
    isNumericChar = numericChars.includes(item) || item == " " || item == "=" ? true : false;
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
    equation
    constants = {
      "deg": "(Math.PI / 180)",
      "pi": "Math.PI",
      "e": "2.718281828459045",
      "tau": "(Math.PI * 2)",
      "phi": "1.61",
      "rad": "1",
      "sin": "Math.sin",
      "cos": "Math.cos",
      "tan": "Math.tan",
      "sqrt": "Math.sqrt"
    }
    for (var [key, value] of Object.entries(constants)) {
      if (equation.includes(key)) {
        index = equation.indexOf(key);
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        if (numbers.includes(equation[index - 1])) {
          value = `*${value}`;
        }
        if (numbers.includes(equation[index + key.length])) {
          value = `${value}*`;
        }
        if (!typeof value === 'string') {
          value = `${value}`;
        }
        equation = equation.replace(key, value);
      }
    }
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