lastSearches = {};
function HandleGithub(enter) {
  var val;
  //set Image
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  setTimeout(async () => {
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        val2 = values.join(" ");
    } else {
        val2 = getSearch().value;
    }
    if (val != val2) return;
    val = val.replaceAll(" ", "+");
    searchUrls = [
        `https://api.github.com/search/repositories?q=${val}`,
        `https://api.github.com/search/users?q=${val}`,
        `https://api.github.com/search/issues?q=${val}`,
    ];
    var response;

    var rateLimit = false;
    console.log(searchUrls);
    if (lastSearches[val] != undefined) {
        response = lastSearches[val];
        rateLimit = false;
    } else {
        for (const searchUrl of searchUrls) {
            const rsp = await fetch(searchUrl);
            const data = await rsp.json();
            if (rsp.status == 403) {
                rateLimit = true;
                break;
            }
            response = data.items;
            if (response == undefined || response.length == 0) {
                response = null;
            } else {
                response = response[0];
                break;
            }
        }
    }
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        val2 = values.join(" ");
    } else {
        val2 = getSearch().value;
    }
    if (val != val2) return;
    lastSearches[val] = response;
    const resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = rateLimit ? "Rate limit exceeded please try again in a bit" : response == null ? "No results" : `Press enter to open ${response.full_name}`;
    const img = document.createElement('img');
    img.src = icons['weather'];
    img.alt = '';
    resultEl.appendChild(img);
    if (enter) {
        let location = val;
        url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
        ipcRenderer.send('open-url', url);
    }
  }, 500);
}