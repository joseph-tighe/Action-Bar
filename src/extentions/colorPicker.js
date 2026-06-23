function handleColorPicker(key, output) {
  output.updateImage("../static/images/colorPicker.svg");
  var val;
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  output.updateText(`<input type="color" id="html5colorpicker" value="${val}" onchange="document.getElementById('search').value = document.getElementById('search').value.split(' ')[0] + ' ' + document.getElementById('html5colorpicker').value;" style="width:85%;">`);
}
function copyColorPicker(text) {
  navigator.clipboard.writeText(document.getElementById('html5colorpicker').value);
}