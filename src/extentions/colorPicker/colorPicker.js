function handleColorPicker(key, output, search) {
  output.updateImage("extentions/colorPicker/colorPicker.svg");
  output.updateText(`<input type="color" id="html5colorpicker" value="${search.getQuery()}" onchange="document.getElementById('search').value = document.getElementById('search').value.split(' ')[0] + ' ' + document.getElementById('html5colorpicker').value;" style="width:85%;">`);
}
function copyColorPicker(text) {
  navigator.clipboard.writeText(document.getElementById('html5colorpicker').value);
}