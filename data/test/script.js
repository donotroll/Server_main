
const ws = new WebSocket(`ws://${window.location.hostname}:8080/ws`);

ws.onmessage = (event) => {
  //console.log('Received:', event.data);
  let d = JSON.parse(event.data);
  //console.log(`Received value for group ${d.group_id}, index ${d.group_index}: ${d.dataPoint}`);
  const group = d.group_id;
  const index = d.group_index;  
  const value = d.dataPoint;

  const chart = chartMap.get(`${group},${index}`);
  //console.log(chart.data.datasets[0].data);
  const settings = chartSettings.get(`${group}`);
  const data = chart.data.datasets[0].data;
  const { time, Ts, maxPoints } = settings;

  if (data.length >= maxPoints) data.shift();
  data.push({ x: time, y: value });
  settings.time += Ts;

  const windowSize = Ts * maxPoints;
  chart.options.scales.x.min = settings.time - windowSize;
  chart.options.scales.x.max = settings.time;

  chart.update('none');
};

function broadcastFrequency(group, freq) {
  console.log(`Broadcasting frequency ${freq} Hz for group ${group}`);
  samplingFreq[group] = freq; //update sampling frequency
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ group, freq }));
  }
}

document.getElementById("freqSlider1").addEventListener("input", (e) => {
  const freq = parseInt(e.target.value, 10);
  document.getElementById("freqLabel1").textContent = `${freq} Hz`;
  broadcastFrequency(0, freq);
});

document.getElementById("freqSlider2").addEventListener("input", (e) => {
  const freq = parseInt(e.target.value, 10);
  document.getElementById("freqLabel2").textContent = `${freq} Hz`;
  broadcastFrequency(1, freq);
});

window.addEventListener('load', initCharts);

