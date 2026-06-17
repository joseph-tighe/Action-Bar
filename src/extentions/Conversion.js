function getValueAndUnit(value) {
  startingIndex = 0;
  for (char of value) {
    if (char.match(/[1-9]/)) {
      break;
    }
    startingIndex++;
  }
  value2 = value.slice(startingIndex);
  number = "";
  unit = "";
  for (char of value2) {
    if (char.match(/[a-zA-Z]/) || (char === " " && unit === "")) {
      unit += char;
    } else if (unit == "") {
      number += char;
    } else {
      break;
    }
  }
  return [number, unit];
}
function getUnit(value) {
  startingIndex = 0;
  for (char of value) {
    if (char.match(/[a-zA-Z]/)) {
      break;
    }
    startingIndex++;
  }
  value2 = value.slice(startingIndex);
  unit = "";
  for (char of value2) {
    if (unit === "" || unit.match(/[a-zA-Z]/)) {
      unit += char;
    } else {
      break;
    }
  }
  return unit;
}
function formatUnit(unit) {
  unit = unit.toLowerCase();
  unit = unit.replace(" ", "");
  for (key in unitNames) {
    if (unitNames[key].includes(unit)) {
      return key;
    }
  }
  return unit;
}
function RunConverter() {
  if (canConvert() !== 'nothing') {
    valuesString = getSearch().value;
    values = valuesString.split("to");
    if (values.length === 2) {
      var from = values[0];
      var to = values[1];
      if (from[from.length - 1] === " ") {
        from = from.slice(0, -1);
      }
    }
    [FromNumber, FromUnit] = getValueAndUnit(from);
    toUnit = getUnit(to);
    toUnit = formatUnit(toUnit);
    fromUnit = formatUnit(FromUnit);
    var conversion = conversions[fromUnit + "-" + toUnit];
    const resultEl = document.getElementsByClassName('result')[0];
    result = parseFloat(FromNumber) * conversion;
    resultEl.textContent = result; // for text part
    const img = document.createElement('img');
    img.src = icons['converter'];
    img.alt = '';
    resultEl.appendChild(img);
  }
}

function canConvert() {
  s = getSearch().value;
  if (s.length === 0) return false;
  if (s.includes("to")) {
    return 'converter';
  }
  return false;
}