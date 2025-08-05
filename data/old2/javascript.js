var gateway = `ws://${window.location.hostname}:8080/ws`;
var websocket;

// Data buffers
const MAX_POINTS = 30;
let timeLabels = [];

let voltageData = [];
let currentData = [];
let powerData = [];

const chartMap = new Map();


window.addEventListener('load', onload);

function onload() {
  initWebSocket();
  initCharts();
}

function initWebSocket() {
  console.log('Opening WebSocket...');
  websocket = new WebSocket(gateway);
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
  websocket.onmessage = onMessage;
}

function onOpen() {
  console.log('WebSocket Connected');
}

function onClose() {
  console.log('WebSocket Closed');
  setTimeout(initWebSocket, 2000);
}

function onMessage(event) {
  console.log('Received:', event.data);
  let data = JSON.parse(event.data);

  // Update values on cards
  document.getElementById("voltage").innerHTML = data.voltage;
  document.getElementById("current").innerHTML = data.current;
  document.getElementById("power").innerHTML = data.power;

  // Update time and data arrays
  const now = new Date().toLocaleTimeString();

  timeLabels.push(now);
  voltageData.push(parseFloat(data.voltage));
  currentData.push(parseFloat(data.current));
  powerData.push(parseFloat(data.power));

  // Keep data to max points
  if (timeLabels.length > MAX_POINTS) {
    timeLabels.shift();
    voltageData.shift();
    currentData.shift();
    powerData.shift();
  }

  updateCharts();
}


function toggleDropdown() {
    document.getElementById("graphContainer").classList.toggle("show");
  }

function toggleDropdown1() {
    document.getElementById("graphContainer1").classList.toggle("show");
  }

// Chart.js chart instances
let voltageChart, currentChart, powerChart;

function initCharts() {
  const commonOptions = {
    type: 'line',
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          title: { display: true, text: 'Time' },
        },
        y: {
          beginAtZero: true,
        }
      }
    }
  };

  voltageChart = new Chart(document.getElementById('voltageChart'), {
    ...commonOptions,
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Voltage (V)',
        data: voltageData,
        borderColor: 'blue',
        fill: false
      }]
    }
  });

  currentChart = new Chart(document.getElementById('currentChart'), {
    ...commonOptions,
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Current (mA)',
        data: currentData,
        borderColor: 'red',
        fill: false
      }]
    }
  });

  powerChart = new Chart(document.getElementById('powerChart'), {
    ...commonOptions,
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Power (mW)',
        data: powerData,
        borderColor: 'green',
        fill: false
      }]
    }
  });
}

function updateCharts() {
  voltageChart.update();
  currentChart.update();
  powerChart.update();
}
