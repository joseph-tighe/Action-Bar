async function doFetchMusic(q) {
    let url = `https://musicbrainz.org/ws/2/recording/?query=${q}&fmt=json&limit=25&offset=0`;
    const rsp = await fetch(url);
    const data = await rsp.json();
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

function RunSearchMusic(key, output) {
    output.updateImage("extentions/youtubeMusic/music.svg");
    let search = new Search();
    let val = search.getQuery();
    fetchAsyncMusic(val.replaceAll(" ", "+")).then(data => {
        if (data.recordings.length > 0 && search.isRelevant()) {
            output.updateText(`Press enter to open ${data.recordings[0].title}`);
            if (key === 'Tab') {
                search.setText(data.recordings[0].title);
            } else if (key === 'Enter') {
                let location = val;
                url = `https://music.youtube.com/search?q=${data.recordings[0].title}`;
                ipcRenderer.send('open-url', url);
            }
        }
    });
}