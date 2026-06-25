function handleColorPicker(key, output) {
  output.updateImage("extentions/colorPicker/colorPicker.svg");
  let search = new Search();
  output.updateText(`<input type="color" id="html5colorpicker" value="${search.getQuery()}" onchange="document.getElementById('search').value = document.getElementById('search').value.split(' ')[0] + ' ' + document.getElementById('html5colorpicker').value;" style="width:85%;">`);
}
function copyColorPicker(text) {
  navigator.clipboard.writeText(document.getElementById('html5colorpicker').value);
}