function RunWeather(enter) {
  var val;
  //set Image
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.textContent = `Press enter to get the weather for ${val == "" ? "your current location" : val}`;
  const img = document.createElement('img');
  img.src = icons['weather'];
  img.alt = '';
  resultEl.appendChild(img);
  if (enter) {
    let location = val;
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}