function handleColorPicker(key) {
  var val;
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  loadAnswer("../static/images/colorPicker.svg", `<input type="color" id="html5colorpicker" value="${val}" onchange="document.getElementById('search').value = document.getElementById('search').value.split(' ')[0] + ' ' + document.getElementById('html5colorpicker').value;" style="width:85%;">`);
}
function copyColorPicker() {
  navigator.clipboard.writeText(document.getElementById('html5colorpicker').value);
}