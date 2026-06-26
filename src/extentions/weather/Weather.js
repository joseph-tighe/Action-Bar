function RunWeather(key, output, search) {
  var val;
  output.updateImage("extentions/weather/weather.svg");
  val = search.getQuery();
  output.updateText(`Press enter to get the weather for ${val == "" ? "your current location" : val}`);
  if (key === 'Enter') {
    let location = val;
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}