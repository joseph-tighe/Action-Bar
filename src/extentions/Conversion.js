const unitNames = {
  "in": ["inches", "inch", "in"],
  "ft": ["feet", "foot", "ft"],
  "mi": ["miles", "mile", "mi"],
  "km": ["kilometers", "kilometer", "km"],
  "m": ["meters", "meter", "m"],
  "cm": ["centimeters", "centimeter", "cm"],
  "mm": ["millimeters", "millimeter", "mm"],
  "yd": ["yards", "yard", "yd"],
  "lb": ["pounds", "pound", "lbs", "lb"],
  "kg": ["kilograms", "kilogram", "kg"],
  "g": ["grams", "gram", "g"],
  "oz": ["ounces", "ounce", "oz"],
  "ml": ["milliliters", "milliliter", "ml"],
  "cl": ["centiliters", "centiliter", "cl"],
  "l": ["liters", "liter", "l"],
  "cup": ["cups", "cup", "cu"],
  "tsp": ["teaspoons", "teaspoon", "tsp"],
  "tbsp": ["tablespoons", "tablespoon", "tbsp"],
  "fl oz": ["fluidounces", "fluidounce", "floz"],
  "pt": ["pints", "pint", "pt"],
  "qt": ["quarts", "quart", "qt"],
  "gal": ["gallons", "gallon", "gal"],
  "min": ["minutes", "minute", "min"],
  "hr": ["hours", "hour", "hr"],
  "s": ["seconds", "second", "s"],
  "ms": ["milliseconds", "millisecond", "ms"],
  "F": ["fahrenheit", "f"],
  "C": ["celsius", "c"],
  "K": ["kelvin", "k"]
};

const conversionsStart = {
  // Length
  "in-ft": 1 / 12,
  "ft-in": 12,

  "in-mi": 1 / 63360,
  "mi-in": 63360,

  "mi-km": 1.60934,
  "km-mi": 1 / 1.60934,

  "km-ft": 3280.8399,
  "ft-km": 1 / 3280.8399,

  "m-cm": 100,
  "cm-m": 1 / 100,

  "m-mm": 1000,
  "mm-m": 1 / 1000,

  "m-ft": 3.28084,
  "ft-m": 1 / 3.28084,

  "yd-ft": 3,
  "ft-yd": 1 / 3,

  "yd-mi": 1 / 1760,
  "mi-yd": 1760,

  // Mass
  "lb-kg": 0.453592,
  "kg-lb": 1 / 0.453592,

  "kg-g": 1000,
  "g-kg": 1 / 1000,

  "g-oz": 1 / 28.34952,
  "oz-g": 28.34952,

  "oz-lb": 1 / 16,
  "lb-oz": 16,

  // Volume
  "ml-l": 1 / 1000,
  "l-ml": 1000,

  "l-cl": 100,
  "cl-l": 1 / 100,

  "tsp-tbsp": 1 / 3,
  "tbsp-tsp": 3,

  "tbsp-fl oz": 1 / 2,
  "fl oz-tbsp": 2,

  "pt-qt": 1 / 2,
  "qt-pt": 2,

  "qt-gal": 1 / 4,
  "gal-qt": 4,

  // US gallons
  "gal-l": 3.78541,
  "l-gal": 1 / 3.78541,

  // Time
  "min-s": 60,
  "s-min": 1 / 60,

  "s-ms": 1000,
  "ms-s": 1 / 1000,

  "hr-s": 3600,
  "s-hr": 1 / 3600,

  "hr-min": 60,
  "min-hr": 1 / 60
};
const specialConversions = {
  "F-C": (x) => (x - 32) * 5 / 9,
  "C-F": (x) => x * 9 / 5 + 32,
  "K-F": (x) => (x - 273.15) * 9/5 + 32,
  "F-K": (x) => (x - 32) * (5 / 9) + 273.15,
  "K-C": (x) => x - 273.15,
  "C-K": (x) => x + 273.15
};

function getAllConverstions() {
  const conversions = {};
  const units = Object.keys(unitNames);

  for (const unit of units) {
    for (const unit2 of units) {
      if (unit === unit2) continue;

      const key = unit + "-" + unit2;

      if (key in conversionsStart) {
        conversions[key] = conversionsStart[key];
      } else {
        conversions[key] = getConversion(
          unit,
          unit2,
          0,
          10,
          1,
          new Set()
        );
      }
    }
  }

  return conversions;
}

function getConversion(
  from,
  to,
  depth,
  maxDepth,
  conversion,
  visited
) {
  if (depth > maxDepth) return NaN;
  if (visited.has(from)) return NaN;

  visited.add(from);

  const units = Object.keys(unitNames);

  for (const unit of units) {
    const key = from + "-" + unit;

    if (!(key in conversionsStart)) continue;

    const newConversion =
      conversion * conversionsStart[key];

    if (unit === to) {
      return newConversion;
    }

    const conv = getConversion(
      unit,
      to,
      depth + 1,
      maxDepth,
      newConversion,
      new Set(visited)
    );

    if (!isNaN(conv)) {
      return conv;
    }
  }

  return NaN;
}

const conversions = getAllConverstions();

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
    var value;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
      values = getSearch().value.split(" ");
      values.shift();
      valuesString = values.join(" ");
    } else {
      valuesString = getSearch().value;
    }
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