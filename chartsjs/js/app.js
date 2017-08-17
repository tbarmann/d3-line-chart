var chartData = {};
var charts = [];
var defaultMonthsToShow = 6;
var chartBackgroundColor = '#212429';
var customRed = '#FF4000';

function getData() {
  var metals = ['omi', 'aluminum'];
  var urls = metals.map(function(metal) {
    // return './js/' + metal + '.json';
    return 'https://www.e-illuminati.com/api.php?metal=' + metal + '&startDate=2013_01';
  });
  urls.forEach(function(url){
    $.getJSON(url, function(response) {
      var metal = response.metal;
      var history = sliceHistory(response.price_data.history, defaultMonthsToShow);
      var config = buildConfig(history, metal);
      chartData[metal] = response;
      var ctx = document.getElementById(metal);
      ctx.style.backgroundColor = chartBackgroundColor;
      charts[metal] = new Chart(ctx, config);
      $('.period-selector').show();
    });
  });  
}

function sliceHistory(history, months) {
  var count = history.length;
  return history.slice(count - months);
}

function buildConfig(history, metal) {
  var dates = history.map(function(point){
    return  moment(point['year-mo'], 'YYYY_MM').toDate();
  });
  var prices = history.map(function(point){
    return point.price;
  });
  var options = {
    layout: {
      padding: {top: 50, left: 50, right: 75, bottom: 50}
    },
    responsive: true,
    title:{
      display:false
    },
    tooltips: {
      mode: 'index',
      intersect: false,
      enabled: false
    },
    legend: {
      display: false
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        gridLines: {color: '#444444', drawBorder: false},
        display: true,
        type: 'time',
        unit: 'month',
        unitStepSize: 1,
        time: {
          displayFormats: {'month': 'MMM YYYY'}
        },
        scaleLabel: {
          display: false
        }
      }],
      yAxes: [{
        gridLines: {display: false},
        display: true,
        scaleLabel: {
          display: false
        }
      }]
    }
  };

  return {
    type: 'line',
    data: {
      pointHitDetectionRadius: 20,
      labels: dates,
      datasets: [{
        label: 'Actual',
        lineTension: 0,
        backgroundColor: customRed,
        borderColor:  customRed,
        data: prices,
        fill: false,
        pointHoverRadius: 4,
        pointHighlihtStroke: 4,
        pointHoverBackgroundColor: chartBackgroundColor
      }]
    },
    options: options
  };
}

window.onload = function() {
  getData();
};

$('.period-selector input[type=radio]').on('change', function() {
  //console.log(this.name, this.value);
  var metal = this.name;
  var history = chartData[metal].price_data.history;
  var months = parseInt(this.value, 10);
  var newHistory = sliceHistory(history, months);
  var newConfig = buildConfig(newHistory, metal);
  charts[metal].config = newConfig;
  charts[metal].update();
});

