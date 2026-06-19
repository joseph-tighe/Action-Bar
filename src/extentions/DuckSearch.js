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

function RunSearch() {
  var val;
  if (getSearch().value.includes(settings['tool-decloration-char'])) {
    values = getSearch().value.split(" ");
    values.shift();
    val = values.join(" ");
  } else {
    val = getSearch().value;
  }
  fetchAsyncDDG(val.replaceAll(" ", "+")).then(data => {
    var val2;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        val2 = values.join(" ");
    } else {
        val2 = getSearch().value;
    }
    console.log(data);
    if (data.RelatedTopics.length > 0 && val == val2) {
      const resultEl = document.getElementsByClassName('result')[0];
      resultEl.textContent = `${data.RelatedTopics[0].Text}`;
      const img = document.createElement('img');
      img.src = icons['ddg'];
      img.alt = '';
      resultEl.appendChild(img);
    }
  });
}