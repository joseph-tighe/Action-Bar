function RunWeather(enter) {
  //set Image
  const resultEl = document.getElementsByClassName('result')[0];
  resultEl.textContent = `Press enter to get the weather for ${getSearch().value.split("weather")[1].replaceAll(" ", "") == "" ? "your current location" : getSearch().value.split("weather")[1]}`;
  const img = document.createElement('img');
  img.src = icons['weather'];
  img.alt = '';
  resultEl.appendChild(img);
  if (enter) {
    let location = getSearch().value.split("weather")[1].replaceAll(" ", "+");
    url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
    ipcRenderer.send('open-url', url);
  }
}