function RunWeather(key, output) {
  var val;
  output.updateImage("extentions/weather/weather.svg");
  val = new Search().getQuery();
  output.updateText(`Press enter to get the weather for ${val == "" ? "your current location" : val}`);
  if (key === 'Enter') {
    let location = val;
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}