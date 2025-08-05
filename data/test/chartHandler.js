
const chartNames = ['voltage', 'current', 'power'];
const y_title = ['current (mA)', 'Voltage (V)', 'Power (W)'];
const chartMap = new Map();
const chartSettings = new Map();
const chartTimers = new Map();


const MAX_POINTS = 100;
const samplingFreq = { 0: 1, 1: 1 };  

function createChart(ctx, group, index) {
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: chartNames[index],
        data: [],
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Time (s)'
          },
          ticks: {
            stepSize: 1,
            callback: v => v.toFixed(1)
          }
        },
        y: {
          title: {
            display: true,
            text: y_title[index],
          }
        }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  return chart;
}


function initCharts() {
  for (let i = 0; i < 6; i++) {
    const group = i < 3 ? 0 : 1;
    const canvas = document.getElementById(`chart-${i}`);
    const chart = createChart(canvas, group, i % 3);
    chartMap.set(`${group},${i % 3}`, chart);

    const Ts = 1; // 300 ms sampling period
    chartSettings.set(`${group}`, {
      time: 0,
      Ts: Ts,
      maxPoints: 100
    });
    //startSampling(`${group},${i % 3}`, `${group}`, 1/Ts); // testing
  }
}


function updateChart(chartId, group) {
//console.log(`Updating chart for ${chartId}`);

    const chart = chartMap.get(chartId);
    console.log(chart.data.datasets[0].data);
    const settings = chartSettings.get(group);
  const data = chart.data.datasets[0].data;
  const { time, Ts, maxPoints } = settings;

  if (data.length >= maxPoints) data.shift();
  const value = Math.sin(time) + Math.random() * 0.1;
  data.push({ x: time, y: value });
  settings.time += Ts;

  const windowSize = Ts * maxPoints;
  chart.options.scales.x.min = settings.time - windowSize;
  chart.options.scales.x.max = settings.time;

  chart.update('none');
 
  
}

function startSampling(chartId, group, Ts) {

  clearInterval(chartTimers.get(chartId));

  const timer = setInterval(() => updateChart(chartId, group), Ts * 1000);
  chartTimers.set(chartId, timer);

}