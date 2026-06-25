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

function RunSearch(key, output) {
  output.updateImage("../static/images/DDG.svg");
  let search = new Search();
  fetchAsyncDDG(search.getQuery().replaceAll(" ", "+")).then(data => {
    output.updateImage("../static/images/DDG.svg");
    if (data.RelatedTopics.length > 0 && search.isRelevant()) {
      output.updateText(data.RelatedTopics[0].Text);
    } else {
      output.destroy();
    }
  });
}