lastSearches = {};
function HandleGithub(key, output) {
  output.updateImage("extentions/github/github.svg");
  let search = new Search();
  setTimeout(async () => {
    if (!search.isRelevant()) return;
    val = search.getQuery().replaceAll(" ", "+");
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
    if (!search.isRelevant()) return;
    lastSearches[val] = response;
    output.updateText(rateLimit ? "Rate limit exceeded please try again in a bit" : response == null ? "No results" : `Press enter to open ${response.full_name}`);
    if (key === 'Enter') {
        let location = val;
        url = `https://duckduckgo.com/?t=ffab&q=weather+${location}&ia=web`
        ipcRenderer.send('open-url', url);
    }
  }, 400);
}
function copyGithub(text) {
  navigator.clipboard.writeText(text.split(" ").splice(4));
}