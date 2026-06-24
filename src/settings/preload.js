const ipc = require('electron').ipcRenderer;
var settings = {};
fetch("../../config/settings.json").then(response => response.json()).then(data => {
  settings = data;
  console.log(settings);
  for (const key in settings) {
    document.getElementsByClassName("sidebar")[0].innerHTML += `<div class="item">${key}</div>`;
  }
  for (i = 0; i < document.getElementsByClassName("item").length; i++) {
    document.getElementsByClassName("item")[i].addEventListener("click", function() {
      openSetting(this.innerHTML);
    });
  }
  saveBtn = document.createElement("button");
  saveBtn.innerHTML = "Save";
  saveBtn.addEventListener("click", () => {
    ipc.send('update-settings', settings);
  });
  document.getElementsByClassName("sidebar")[0].appendChild(saveBtn);
});
function openSetting(key) {
    content = document.getElementsByClassName("content")[0];
    content.innerHTML = "";
    for (const key1 in settings[key]) {
        showItem(key1, settings[key][key1], content, [key]);
    }
}
function showItem(key, item, DOMwrapper, keys) {
    if (typeof item === "object") {
        if (Array.isArray(item)) {
            let section = document.createElement("div");
            section.className = "section";
            let header = document.createElement("h2");
            header.innerHTML = key;
            DOMwrapper.appendChild(header);
            DOMwrapper.appendChild(section);
            header.addEventListener("click", ()=>{
                section.style.maxHeight = section.style.maxHeight == "0px" ? "100vh" : "0px";
            });
            section.style.maxHeight = "0px";
            for (const key in item) {
                showItem(key, item[key], section, keys.concat(key));
            }
            add = document.createElement("button");
            add.innerHTML = "Add";
            add.addEventListener("click", () => {
                item.push("");
                showItem(item.length - 1, "", section, keys.concat(key));
            });
            section.appendChild(add);
        } else {
            let section = document.createElement("div");
            section.className = "section";
            let header = document.createElement("h2");
            header.innerHTML = key;
            DOMwrapper.appendChild(header);
            DOMwrapper.appendChild(section);
            header.addEventListener("click", ()=>{
                section.style.maxHeight = section.style.maxHeight == "0px" ? "100vh" : "0px";
            });
            section.style.maxHeight = "0px";
            for (const key in item) {
                showItem(key, item[key], section, keys.concat(key));
            }
        }
    } else if (typeof item === "string" || typeof item === "number") {
        section = document.createElement("div");
        section.className = "item";
        DOMwrapper.appendChild(section);
        input = document.createElement("input");
        input.type = "text";
        input.value = item;
        input.addEventListener("change", () => {
            if (typeof item === "number") {
                item = parseFloat(input.value);
            } else {
                item = input.value;
            }
            addItem(keys.concat(key), item);
        });
        section.innerHTML = `<div class="item">${key}:</div>`;
        section.getElementsByClassName("item")[section.getElementsByClassName("item").length - 1].appendChild(input);
    } else if (typeof item === "boolean") {
        section = document.createElement("div");
        section.className = "item";
        DOMwrapper.appendChild(section);
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = item;
        input.addEventListener("change", () => {
            addItem(keys.concat(key), input.checked);
        });
        section.innerHTML = `<div class="item">${key}:</div>`;
        section.getElementsByClassName("item")[section.getElementsByClassName("item").length - 1].appendChild(input);

    }
}
function addItem(keys, item) {
    let X = settings;
    for (let i = 0; i < keys.length - 1; i++) {
        X = settings[keys[i]]
    }
    X[keys[keys.length - 1]] = item;
}