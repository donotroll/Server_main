
const ws = new WebSocket(`ws://${window.location.hostname}/ws`);  

ws.onmessage = (event) => {
  const d = JSON.parse(event.data);
  const { group, index, value } = d;


  /*const key = `${group},${index}`;
  const chart = chartMap.get(key);

  if (!chart) return;

  const dataset = chart.data.datasets[0];
  const labels = chart.data.labels;

  const ts = 1 / samplingFreq[group];  // time step
  const lastX = labels.length > 0 ? labels[labels.length - 1] : 0;
  const nextX = lastX + ts;

  labels.push(nextX);
  dataset.data.push(value);

  if (labels.length > MAX_POINTS) {
    labels.shift();
    dataset.data.shift();
  }

  chart.options.scales.x.min = labels[0];
  chart.options.scales.x.max = labels[labels.length - 1];
  chart.update();
*/

      const chart = chartMap.get(`${group},${index}`);
    //console.log(chart.data.datasets[0].data);
    const settings = chartSettings.get(chartId);
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

