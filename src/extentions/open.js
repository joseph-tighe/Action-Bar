var lastSearch = "";
ipcRenderer.on('open-file', (event, file, action, type) => {
    loadAnswer("../static/images/app.svg", `${file.action == "Open" ? "Opening" : "Found"} ${file.type == "file" ? "file" : "app"} ${file.file}`);
    imageExtensions = ["png", "jpg", "jpeg", "svg", "webp"]
    var resultsEl = document.getElementsByClassName('resultWrapper')[0];
    var resultEl = document.getElementsByClassName('result')[0];
    if (imageExtensions.includes(file.file.split(".").pop())) {
        resultEl.textContent = `${file.action == "Open" ? "Opening" : "Found"} ${file.type == "file" ? "file" : "app"} ${file.file}`;
        const imgWrapper = document.createElement('div');
        const img = document.createElement('img');
        imgWrapper.className = "found-image-wrapper";
        imgWrapper.appendChild(img);
        document.getElementsByClassName('resultWrapper')[0].appendChild(imgWrapper);
        img.src = file.file;
        img.className = "found-image";
        img.alt = '';
        document.getElementsByClassName('found-image-wrapper')[0].appendChild(img);
        /*var currentSearch = getSearch().value;
        function func() {
            if (getSearch().value != currentSearch) {
                resultsEl.removeChild(document.getElementsByClassName('found-image-wrapper')[0]);
                getSearch().removeEventListener("keyup",func);
            }
        }
        getSearch().addEventListener("keyup", func)*/
    }
});
function runOpen(key) {
    var appOrFile;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().value.split(" ");
        values.shift();
        appOrFile = values.join(" ");
    } else {
        appOrFile = getSearch().value;
    }
    if (key === 'Tab') {
        x = document.getElementsByClassName('result')[0].textContent.split(" ");
        filePath = x.slice(2).join(" ");
        getSearch().value = filePath;
    }
    if (appOrFile.length < 1 || (appOrFile == lastSearch && !(key === 'Enter'))) return;
    lastSearch = appOrFile;
    if (key === 'Enter') {
        ipcRenderer.send('search-open-apps/files', appOrFile);
    } else {
        ipcRenderer.send('search-apps/files', appOrFile);
    }
}
function copyOpen(text) {
  navigator.clipboard.writeText(text.split(" ").splice(2));
}