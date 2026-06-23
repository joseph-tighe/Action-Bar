var lastSearch = "";
ipcRenderer.on('open-file', (event, file) => {
    openningOutput.updateText(`${file.action == "Open" ? "Opening" : "Found"} ${file.type == "file" ? "file" : "app"} ${file.file}`);
    imageExtensions = ["png", "jpg", "jpeg", "svg", "webp"]
    if (imageExtensions.includes(file.file.split(".").pop())) {
        const imgWrapper = document.createElement('div');
        const img = document.createElement('img');
        imgWrapper.className = "found-image-wrapper";
        imgWrapper.appendChild(img);
        openningOutput.getWrapper().appendChild(imgWrapper);
        img.src = file.file;
        img.className = "found-image";
        img.alt = '';
        document.getElementsByClassName('found-image-wrapper')[0].appendChild(img);
        openningOutput.removeIcon();
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
var openningOutput = null;
function runOpen(key, output) {
    output.updateImage("../static/images/app.svg");
    openningOutput = output;
    var appOrFile;
    if (getSearch().value.includes(settings['tool-decloration-char'])) {
        values = getSearch().trim().split(" ");
        values.shift();
        appOrFile = values.join(" ");
    } else {
        appOrFile = getSearch().value.trim();
    }
    if (key === 'Tab') {
        x = document.getElementsByClassName('result')[0].textContent.split(" ");
        filePath = x.slice(2).join(" ");
        getSearch().value = filePath;
    }
    if (appOrFile.length < 1 || (appOrFile == lastSearch && !(key === 'Enter'))) {
        if (appOrFile.length < 1) {
            output.updateText("No results");
        } else {
            output.updateText("Press enter to open");
        }
    };
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