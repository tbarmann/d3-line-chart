
var chartData = {};
var charts = [];
var defaultMonthsToShow = 6;
var chartBackgroundColor = '#212429';
// var chartBackgroundColor = '#fff';
var customRed = '#FF4000';

Chart.defaults.global.defaultColor = 'green';

function getData() {
  var metals = ['omi', 'aluminum'];
  var urls = metals.map(function(metal) {
    return './js/' + metal + '.json';
    // return 'https://www.e-illuminati.com/api.php?metal=' + metal + '&startDate=2013_01';
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
      enabled: false,
      custom: customToolTip(metal),
      callbacks: {
        label: function(tooltipItem, data) {
          return '$' + parseFloat(tooltipItem.yLabel).toFixed(2);
        }
      }
    },
    legend: {
      display: false
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    elements: {
      line: {
        borderWidth: 5
      },
      point: {
        radius: 1,
        hoverRadius: 10,
        hitRadius: 10
      }
    },
    annotations:  [{
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis',
      borderColor: 'yellow',
      borderWidth: 2
    }],
    scales: {
      xAxes: [{
        ticks: {
          fontColor: "white",
          callback: function(value, index, arr) {
            return (index === 0 || index  === arr.length-1) ? value.split(' ') : null;
          }
        },
        gridLines: {
          zeroLineColor: 'white',
          color: 'white',
          drawBorder: false,
          display: true
        },
        display: true,
        type: 'time',
        unit: 'month',
        unitStepSize: 1,
        time: {
          displayFormats: {'month': 'MMM YYYY'},
          unit: 'month',
          tooltipFormat: 'MMM YYYY'

        },
        scaleLabel: {
          display: false
        }
      }],
      yAxes: [{
        gridLines: {
          display: false,
          drawBorder: false,
          zeroLineColor: 'white',

        },
        display: true,
        scaleLabel: {
          display: false
        },
        ticks: {
          callback: function(value, index, values) {
            return '$' + value;
          },
          fontColor: "#fff"
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
        lineBorderWidth: 5,
        backgroundColor: customRed,
        borderColor:  customRed,
        data: prices,
        fill: false,
        pointColor: customRed,
        pointStrokeColor: 'rgb(255,255,255,0)',
        pointHoverRadius: 7,
        pointHoverBorderWidth: 5,
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
  var metal = this.name;
  var history = chartData[metal].price_data.history;
  var months = parseInt(this.value, 10);
  var newHistory = sliceHistory(history, months);
  var newConfig = buildConfig(newHistory, metal);
  charts[metal].config = newConfig;
  charts[metal].update();
});


function customToolTip(metal) {
  return function(tooltipModel) {

    // Tooltip Element
    var tooltipEl = document.getElementById('chartjs-tooltip-' + metal);

    // Create element on first render
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip-' + metal;
      tooltipEl.classList.add('custom-tooltip');
      tooltipEl.innerHTML = "<table></table>"
      document.body.appendChild(tooltipEl);
    }

    // Hide if no tooltip
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
    return;
    }

    // Set caret Position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltipModel.yAlign) {
      tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
      tooltipEl.classList.add('no-transform');
    }

    function getBody(bodyItem) {
      return bodyItem.lines;
    }

    // Set Text
    if (tooltipModel.body) {
      var titleLines = tooltipModel.title || [];
      var bodyLines = tooltipModel.body.map(getBody);

      var innerHtml = '<tbody><tr>';

      innerHtml += '<td class="date">' + tooltipModel.title[0] + '</td>';
      innerHtml += '<td class="price">' + bodyLines[0] + '</td>';
      innerHtml += '</tr></tbody>';

      var tableRoot = tooltipEl.querySelector('table');
      tableRoot.innerHTML = innerHtml;
    }

    // `this` will be the overall tooltip
    var position = this._chart.canvas.getBoundingClientRect();

    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + tooltipModel.caretY + 'px';
  }
}


// https://stackoverflow.com/questions/43113796/chart-js-vertical-crosshair-vertical-annotation-that-moves-with-mouse-in-lin
// $(document).ready(function(){
//   canvas.onmousemove = function (evt) {
//         var points = myChart.getElementsAtXAxis(evt);
//         annotation.annotations[0].value = new Date(myChart.config.data.labels[points[0]._index]);
//         myChart.update();
//     };
/// / });


// crosshairs
// https://jsfiddle.net/8fp3uutt/

// gradient line:
// https://blog.vanila.io/chart-js-tutorial-how-to-make-gradient-line-chart-af145e5c92f9

// tooltip docs
// https://github.com/chartjs/Chart.js/blob/3e94b9431a5b3d6e4bfbfd6a2339a350999b3292/docs/configuration/tooltip.md#custom-tooltips

