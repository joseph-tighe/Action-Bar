async function doFetchDDG(q) {
  let url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`;

  const rsp = await fetch(url);
  const jsonString = await rsp.text();
  const data = JSON.parse(jsonString);
  return data;
}

async function fetchAsyncDDG(q)
{
  try {
    let result = await doFetchDDG(q);
    return result;
  } catch( err ) {
    console.error( err.message );
  }
  return "";
}

function RunDGG(key, output, search) {
  if (key === 'Enter') {
      let query = search.getQuery();
      let url = `https://duckduckgo.com/?q=${query}`;
      ipcRenderer.send('open-url', url);
    return;
  }
  if (search.getQuery().length < 3) {
    output.destroy();
    return;
  }
  output.updateImage("extentions/ddg/DDG.svg");
  fetchAsyncDDG(search.getQuery().replaceAll(" ", "+")).then(data => {
    output.updateImage("extentions/ddg/DDG.svg");
    if (data.RelatedTopics.length > 0 && search.isRelevant()) {
      inputText = ""
      text = data.RelatedTopics[0].Text
      abstract = data.Abstract
      console.log(abstract);
      if (text == "" || text.includes("Category")) {
        if (abstract.length > 50) {
          inputText = abstract.substr(0, 50) + "...";
        } else {
          inputText = abstract;
        }
      } else {
        inputText = text;
      }
      output.updateText(inputText);
    } else {
      output.destroy();
    }
  });
}