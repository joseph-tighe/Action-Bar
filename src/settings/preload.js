const ipc = require('electron').ipcRenderer;
window.addEventListener('DOMContentLoaded', () => {
let settings = {};
let currentGroup = null;
let extentionLoaded = false;
let extentionDirMap = {};
const sidebarList = document.querySelector('.sidebar-list');
const contentBody = document.querySelector('.content-body');
const contentHeader = document.querySelector('.content-header');
const saveBtn = document.getElementById('saveBtn');

fetch('../../config/settings.json')
  .then(response => response.json())
  .then(data => {
    settings = data;
    renderSidebar();
    const firstKey = Object.keys(settings)[0];
    if (firstKey) {
      openSetting(firstKey);
    }
  });

saveBtn.addEventListener('click', () => {
  ipc.send('update-settings', settings);
  if (settings.extensions && typeof settings.extensions === 'object') {
    ipc.send('update-extention-settings', settings.extensions, extentionDirMap);
  }
});

ipc.invoke('get-update-state').then(state => {
  if (state) updater(state);
});

function formatLabel(text) {
  return String(text)
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function renderSidebar() {
  sidebarList.innerHTML = '';
  Object.keys(settings).forEach(key => {
    const item = document.createElement('button');
    item.className = 'sidebar-item';
    item.textContent = formatLabel(key);
    item.addEventListener('click', () => openSetting(key));
    sidebarList.appendChild(item);
  });
  const extentionDownload = document.createElement('button');
  extentionDownload.className = 'sidebar-item';
  extentionDownload.textContent = 'Download Extentions';
  extentionDownload.addEventListener('click', openExtensionStore);
  sidebarList.appendChild(extentionDownload);
}
async function openExtensionStore() {
    // Text Input < put github repo here
    //
    // Btn List
    contentHeader.textContent = "Download Extentions";
    contentBody.innerHTML = '';
    const InputLabel = document.createElement('label');
    InputLabel.textContent = "If you have a github repo, you can download extentions using this textbox";
    contentBody.appendChild(InputLabel);
    const Input = document.createElement('input');
    Input.id = 'extention-store-input';
    Input.type = 'text';
    Input.placeholder = 'joseph-tighe/calculator';
    Input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            ipc.send('download-extention', document.getElementById('extention-store-input').value);
            Input.value = "Downloaded!";
        }
    });
    contentBody.appendChild(Input);
    const breaker = document.createElement('br');
    contentBody.appendChild(breaker);
    let recommendedExtentions = ["joseph-tighe/colorPicker"];
    let commitHashes = ["48ec3ba585b22b4ff7ca32490203fff2f07d7e52"];
    for (const extention of recommendedExtentions) {
      commitExists = (await fetch(`https://github.com/${extention}/commit/${commitHashes[recommendedExtentions.indexOf(extention)]}`)).status === 200;
      if (!commitExists) {
        console.log("commit not found for " + extention + ": " + commitHashes[recommendedExtentions.indexOf(extention)]);
        continue;
      }
      try {
        let manifest = await fetch(`https://raw.githubusercontent.com/${extention}/${commitHashes[recommendedExtentions.indexOf(extention)]}/manifest.json`).then(response => response.json());
        metadata = manifest["metadata"];
        if (metadata["icon"]) {
          icon = `https://raw.githubusercontent.com/${extention}/${commitHashes[recommendedExtentions.indexOf(extention)]}/${metadata["icon"]}`;
        } else {
          icon = "";
        }
        let btn = document.createElement('button');
        btn.innerHTML = `<img src=${icon} alt="No Icon found"></img><div><h3>${metadata.name} - Download now</h3><p>${metadata.description}</p></div>`;
        btn.addEventListener('click', () => {
          ipc.send('download-extention', extention, commitHashes[recommendedExtentions.indexOf(extention)]);
          btn.textContent = "Downloaded!";
          btn.disabled = true;
        });
        contentBody.appendChild(btn);
      } catch (e) {
        console.log("no manifest.json found for " + extention, e);
      }
    }

}
async function openSetting(key) {
  currentGroup = key;
  contentHeader.textContent = formatLabel(key);
  contentBody.innerHTML = '';

  const group = settings[key];
  if (group && typeof group === 'object' && !Array.isArray(group)) {
    renderGroup(group, contentBody, [key]);
  } else {
    contentBody.innerHTML = '<div class="empty-state">No settings available.</div>';
  }

  Array.from(sidebarList.children).forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase() === formatLabel(key).toLowerCase());
  });
  if (key === 'extensions') {
    ipc.send('get-extentions');
    ipc.on('get-extentions', async (event, files) => {
      if (extentionLoaded) {
        return;
      }
      extentionLoaded = true;
      extentionManifests = [];
      for (const extention of files) {
        let data = await fetch(`../../src/extentions/${extention}/manifest.json`).then(response => response.json());
        extentionManifests.push(data);
        extentionDirMap[data.name] = extention;
      }
      extentionSettings = {};
      for (const manifest of extentionManifests) {
        extentionSettings[manifest.name] = manifest.settings;
      }
      renderGroup(extentionSettings, contentBody, ['extensions']);
    });
  }
}

function renderGroup(value, parent, path) {
  if (Array.isArray(value)) {
    const card = createCard(path[path.length - 1]);
    const body = card.querySelector('.section-body');

    value.forEach((item, index) => {
      renderArrayItem(item, body, path.concat(index));
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.textContent = 'Add item';
    addBtn.addEventListener('click', () => {
      value.push('');
      renderGroup(value, parent, path);
      openSetting(currentGroup);
    });

    body.appendChild(addBtn);
    parent.appendChild(card);
    return;
  }

  if (value && typeof value === 'object') {
    const card = createCard(path[path.length - 1]);
    const body = card.querySelector('.section-body');

    Object.entries(value).forEach(([key, child]) => {
      const isStringMap = child && typeof child === 'object' && !Array.isArray(child) &&
        Object.values(child).every(v => typeof v === 'string');

      if (isStringMap) {
        renderMap(child, body, path.concat(key));
      } else {
        renderGroup(child, body, path.concat(key));
      }
    });

    parent.appendChild(card);
    return;
  }

  renderControl(value, parent, path);
}

function createCard(title) {
  const card = document.createElement('section');
  card.className = 'section-card';

  const heading = document.createElement('h2');
  heading.textContent = formatLabel(title);

  const body = document.createElement('div');
  body.className = 'section-body';

  card.appendChild(heading);
  card.appendChild(body);
  return card;
}

function renderControl(value, parent, path) {
  const row = document.createElement('div');
  row.className = 'setting-row';

  const label = document.createElement('div');
  label.className = 'setting-label';
  label.textContent = formatLabel(path[path.length - 1]);

  const control = document.createElement('div');
  control.className = 'setting-control';

  if (typeof value === 'boolean') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => {
      updateValue(path, input.checked);
    });
    control.appendChild(input);
  } else if (typeof value === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.addEventListener('change', () => {
      updateValue(path, Number(input.value));
    });
    control.appendChild(input);
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.addEventListener('change', () => {
      updateValue(path, input.value);
    });
    control.appendChild(input);
  }

  row.appendChild(label);
  row.appendChild(control);
  parent.appendChild(row);
}

function renderArrayItem(item, parent, path) {
  const row = document.createElement('div');
  row.className = 'array-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = item;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    const arr = getByPath(path.slice(0, -1));
    arr.splice(path[path.length - 1], 1);
    openSetting(currentGroup);
  });

  input.addEventListener('change', () => {
    const arr = getByPath(path.slice(0, -1));
    arr[path[path.length - 1]] = input.value;
  });

  row.appendChild(input);
  row.appendChild(removeBtn);
  parent.appendChild(row);
}

function renderMapEntry(key, value, parent, path) {
  const row = document.createElement('div');
  row.className = 'map-row';

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'map-key';
  keyInput.value = key;
  keyInput.placeholder = 'Alias trigger';
  keyInput.addEventListener('change', () => {
    const map = getByPath(path.slice(0, -1));
    const oldKey = path[path.length - 1];
    const newKey = keyInput.value;
    if (newKey && newKey !== oldKey) {
      map[newKey] = map[oldKey];
      delete map[oldKey];
    }
  });

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'map-value';
  valueInput.value = value;
  valueInput.placeholder = 'Replacement text';
  valueInput.addEventListener('change', () => {
    updateValue(path, valueInput.value);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    const map = getByPath(path.slice(0, -1));
    delete map[path[path.length - 1]];
    openSetting(currentGroup);
  });

  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(removeBtn);
  parent.appendChild(row);
}

function renderMap(value, parent, path) {
  const card = createCard(path[path.length - 1]);
  const body = card.querySelector('.section-body');

  Object.entries(value).forEach(([key, val]) => {
    renderMapEntry(key, val, body, path.concat(key));
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'add-btn';
  addBtn.textContent = 'Add entry';
  addBtn.addEventListener('click', () => {
    const map = getByPath(path);
    const newKey = '';
    map[newKey] = '';
    openSetting(currentGroup);
  });

  body.appendChild(addBtn);
  parent.appendChild(card);
}

function updateValue(path, value) {
  let target = settings;
  for (let i = 0; i < path.length - 1; i++) {
    target = target[path[i]];
  }
  target[path[path.length - 1]] = value;
}

function getByPath(path) {
  let target = settings;
  for (const key of path) {
    target = target[key];
  }
  return target;
}
});
function updater(updateObj) {
  const updateBtn = document.getElementById('updateBtn');
  if (!updateBtn) return;

  if (updateObj.error) {
    updateBtn.textContent = `Error: ${updateObj.error}`;
    updateBtn.style.display = 'inline-block';
    updateBtn.onclick = null;
  } else if (updateObj.isUpdateAvailable) {
    if (updateObj.isDownloading && !updateObj.isDone) {
      updateBtn.textContent = `${Math.round(updateObj.progress)}%`;
      updateBtn.style.display = 'inline-block';
    } else if (updateObj.isDone) {
      updateBtn.textContent = 'Update';
      updateBtn.style.display = 'inline-block';
      updateBtn.onclick = () => {
        ipc.send('update-app');
        updateBtn.textContent = 'Updating...';
        updateBtn.onclick = null;
      };
    }
  } else {
    updateBtn.style.display = 'none';
    updateBtn.textContent = 'Update';
    updateBtn.onclick = null;
  }
}
ipc.on('updateModal', (event, updateObj) => {
  updater(updateObj);
});