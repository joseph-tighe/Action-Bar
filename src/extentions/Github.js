lastSearches = {};
function HandleGithub(key) {
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
    if (val != val2.replaceAll(" ", "+")) return;
    lastSearches[val] = response;
    loadAnswer(icons['github'], rateLimit ? "Rate limit exceeded please try again in a bit" : response == null ? "No results" : `Press enter to open ${response.full_name}`);
    if (key === 'Enter') {
        let location = val;
        url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
        ipcRenderer.send('open-url', url);
    }
  }, 400);
}
function copyGithub() {
  navigator.clipboard.writeText(document.getElementsByClassName('result')[0].textContent.split(" ").splice(4));
}