var lastSearch = "";
ipcRenderer.on('open-file', (event, file, action, type) => {
    console.log(action, type, file);
    resultEl = document.getElementsByClassName('result')[0];
    resultEl.textContent = `${file.action == "Open" ? "Opening" : "Found"} ${file.type == "file" ? "file" : "app"} ${file.file}`;
    const img = document.createElement('img');
    img.src = icons['app'];
    img.alt = '';
    resultEl.appendChild(img);
});
function runOpen(enter) {
    var appOrFile;
    if (getSearch().value.includes("@")) {
        appOrFile = getSearch().value.split(" ")[1];
    } else {
        appOrFile = getSearch().value;
    }    
    if (appOrFile.length < 1 || (appOrFile == lastSearch && !enter)) return;
    lastSearch = appOrFile;
    if (enter) {
        ipcRenderer.send('search-open-apps/files', appOrFile);
    } else {
        ipcRenderer.send('search-apps/files', appOrFile);
    }
}
    