async function doFetch(q) {
  let url = "https://en.wikipedia.org/w/rest.php/v1/search/page";
  let headers = {'Api-User-Agent': 'MediaWiki REST API docs examples/0.1 (https://www.mediawiki.org/wiki/API_talk:REST_API)'}
  let params = {
    'q': q,
    'limit': '20'
  };
  let query = Object.keys(params)
             .map(k => k + '=' + encodeURIComponent(params[k]))
             .join('&');
  url = url + '?' + query;

  const rsp = await fetch(url, headers);
  const data = await rsp.json();
  return data;
}

async function fetchAsync(q)
{
  try {
    let result = await doFetch(q);
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
  fetchAsync(val.replaceAll(" ", "+")).then(data => {
    var val2;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        val2 = values.join(" ");
    } else {
        val2 = getSearch().value;
    }
    if (data.pages.length > 0 && val == val2) {
      const resultEl = document.getElementsByClassName('result')[0];
      for (const page of data.pages) {
        if (page.description != "Topics referred to by the same term") {
          resultEl.textContent = `${page.description}`;
          break;
        }
      }
      const img = document.createElement('img');
      img.src = icons['search'];
      img.alt = '';
      resultEl.appendChild(img);
    }
  });
}