window.addEventListener('DOMContentLoaded', () => {
function getSearch() { return document.getElementById('search'); }

// wait up to 5s for element if it's injected later
const start = Date.now();
const waitForSearch = () => {
const s = getSearch();
if (s) {
s.click();
return;
}
if (Date.now() - start < 5000) {
requestAnimationFrame(waitForSearch);
}
}
waitForSearch();

document.addEventListener('click', (e) => {
const s = getSearch();
if (!s) return;
if (e.target.closest && e.target.closest('#search')) {
e.preventDefault();
s.blur();
s.focus({ preventScroll: true });
} else {
s.click();
}
}, true);
});