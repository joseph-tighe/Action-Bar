function RunTimer(key, output) {
  var value;
  output.updateImage("../static/images/timer.svg");
  value = new Search().getQuery();
  let numbers = [""];
  for (const ch of value) {
    if (/\d/.test(ch)) numbers[numbers.length-1] += ch;
    else if (numbers[numbers.length-1] !== "") numbers.push("");
  }
  if (numbers[numbers.length-1] === "") numbers.pop();

  let time = NaN;
  if (numbers.length === 1) time = parseInt(numbers[0]) * 60;
  else if (numbers.length === 2) time = parseInt(numbers[0]) * 60 + parseInt(numbers[1]);
  else if (numbers.length === 3) time = parseInt(numbers[0]) * 3600 + parseInt(numbers[1]) * 60 + parseInt(numbers[2]);
  output.updateText(`${floor((time%(60*60*60))/(60*60))}:${formatTimeInt((time%(60*60))/60)}:${formatTimeInt(time%60)}`.replaceAll("NaN", "0"));
  if (!(key === 'Enter') || isNaN(time) || time < 0 || time > 86400) return 'nothing';

  ipcRenderer.send('show-notification', { title: 'Timer', body: 'Started timer' });
  setTimeout(() => {
    ipcRenderer.send('show-notification', { title: 'Timer', body: 'Time is up' });
  }, time * 1000);
}