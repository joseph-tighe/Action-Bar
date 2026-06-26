const ipc = require('electron').ipcRenderer;
window.addEventListener('DOMContentLoaded', () => {
let settings = {};
let currentGroup = null;

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
}

function openSetting(key) {
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
      renderGroup(child, body, path.concat(key));
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