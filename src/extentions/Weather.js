function RunWeather(key) {
  var val;
  //set Image
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  loadAnswer(icons['weather'], `Press enter to get the weather for ${val == "" ? "your current location" : val}`);
  if (key === 'Enter') {
    let location = val;
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}