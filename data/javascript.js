var array_length = 10;
var yValues = [];
var xValues = [];
for (let i = 0; i < array_length; i++) {
  xValues[i] = i;
  yValues.push(0);
}


var charts = [];

function createChart(name) {
return new Chart(name, {
  type: "line",
  data: {
    labels: xValues,
    datasets: [{
      fill: false,
      lineTension: 0,
      backgroundColor: "rgba(0,0,255,1.0)",
      borderColor: "rgba(0,0,255,0.1)",
      data: yValues
    }]
  },
  options: {
    legend: {display: false},
    scales: {
      yAxes: [{ticks: {min: 0, max:10}}],
    }
  }
});
}

var slider = document.getElementById('ID_RANDOM_INTENSITY');
var output = document.getElementById('ID_RANDOM_INTENSITY_VALUE');
slider.addEventListener('change', slider_changed);

var Socket;

function init() {
  Socket = new WebSocket('ws://' + window.location.host + '/ws');
  charts.push(createChart(document.getElementById('c0')));
  charts.push(createChart(document.getElementById('c1')));

  Socket.onmessage = function(event) {
    processCommand(event);
  };
}

function slider_changed () {
  var l_random_intensity = slider.value;
  console.log(l_random_intensity);
  var msg = { type: "random_intensity", value: l_random_intensity};
  Socket.send(JSON.stringify(msg)); 
}

function addData(chart, obj) {
    chart.data.datasets[0].data.splice(0, obj.dataPoints.length);
    chart.data.datasets[0].data.push(...obj.dataPoints);
    chart.data.labels.splice(0, obj.dataPoints.length);
    for (let i = 0; i < obj.dataPoints.length; i++) {
      chart.data.labels.push(obj.Ts * i);
    }
    chart.options.scales.yAxes[0].ticks.max = obj.read_flags.length + 1; // Update max value of y-axis
    chart.update();
  }

function processCommand(event) {
  var obj = JSON.parse(event.data);
  var type = obj.type;
  if (type.localeCompare("random_intensity") == 0) { 
    var l_random_intensity = parseInt(obj.value); 
    console.log(l_random_intensity); 
    slider.value = l_random_intensity; 
    output.innerHTML = l_random_intensity;
    myChart.options.scales.yAxes[0].ticks.max = l_random_intensity + 1; // Update max value of y-axis
    myChart.update();
  }
  else if (type.localeCompare("sensor_update") == 0) {
    console.log(obj);
    addData(charts[obj.id], obj);
  }
}
window.onload = function(event) {
  init();
}