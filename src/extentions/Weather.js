function RunWeather(key, output) {
  var val;
  output.updateImage("../static/images/weather.svg");
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  output.updateText(`Press enter to get the weather for ${val == "" ? "your current location" : val}`);
  if (key === 'Enter') {
    let location = val;
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}