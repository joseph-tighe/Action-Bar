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
  output.updateImage("extentions/ddg/DDG.svg");
  fetchAsyncDDG(search.getQuery().replaceAll(" ", "+")).then(data => {
    output.updateImage("extentions/ddg/DDG.svg");
    if (data.RelatedTopics.length > 0 && search.isRelevant()) {
      output.updateText(data.RelatedTopics[0].Text);
    } else {
      output.destroy();
    }
  });
}