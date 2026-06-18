var lastSearch = "";
function RunFile(enter) {
    const file = getSearch().value.split(" ")[1];
    if (file.length < 1 || (file == lastSearch && !enter)) return;
    lastSearch = file;
    if (enter) {
        ipcRenderer.send('search-open-files', file);
    } else {
        ipcRenderer.send('search-files', file);
    }
}
ipcRenderer.on('open-file', (event, file) => {
    resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = `Found file ${file.file}`;
    const img = document.createElement('img');
    img.src = icons['app'];
    img.alt = '';
    resultEl.appendChild(img);
});