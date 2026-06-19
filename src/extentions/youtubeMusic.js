async function doFetchMusic(q) {
    let url = `https://musicbrainz.org/ws/2/recording/?query=${q}&fmt=json&limit=25&offset=0`;
    const rsp = await fetch(url);
    const data = await rsp.json();
    console.log(data);
    return data;
}

async function fetchAsyncMusic(q)
{
    try {
        let result = await doFetchMusic(q);
        return result;
    } catch( err ) {
        console.error( err.message );
    }
    return "";
}

function RunSearch(enter) {
    var val;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        val = values.join(" ");
    } else {
        val = getSearch().value;
    }

    fetchAsyncMusic(val.replaceAll(" ", "+")).then(data => {
        var val2;
        if (getSearch().value.includes(settings['tool-decloration-char'])) {
            values = getSearch().value.split(" ");
            values.shift();
            val2 = values.join(" ");
        } else {
            val2 = getSearch().value;
        }
        if (data.recordings.length > 0 && val == val2) {
            const resultEl = document.getElementsByClassName('result')[0];
            resultEl.textContent = `Press enter to open ${data.recordings[0].title}`;// - ${data.recordings[0]["artist-credit"][0].name}
            const img = document.createElement('img');
            img.src = icons['youtube'];
            img.alt = '';
            resultEl.appendChild(img);
            if (enter) {
                let location = val;
                url = `https://music.youtube.com/search?q=${data.recordings[0].title}`;
                ipcRenderer.send('open-url', url);
            }
        }
    });
}