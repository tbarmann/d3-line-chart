// configuration
var metals = ['omi', 'aluminum'];
var defaultMonthsToShow = 6;
var chartBackgroundColor = '#212429';
var customRed = '#FF4000';
var chartPadding = {top: 100, left: 50, right: 75, bottom: 75};
var xAxisFontColor = "white";

// globals
var chartData = {};
var charts = [];

Chart.plugins.register({
  beforeDraw: function(chartInstance) {
    var ctx = chartInstance.chart.ctx;
    ctx.fillStyle = chartBackgroundColor;
    ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
  },
  afterDatasetsDraw: function(chart) {
    if (chart.tooltip._active && chart.tooltip._active.length) {
      var activePoint = chart.tooltip._active[0],
        ctx = chart.ctx,
        y_axis = chart.scales['y-axis-0'],
        x = activePoint.tooltipPosition().x,
        topY = y_axis.top,
        bottomY = y_axis.bottom + 10;

      // draw line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'white';
      ctx.stroke();
      ctx.restore();
    }
  }
});

function getData() {
  var urls = metals.map(function(metal) {
    return 'https://www.e-illuminati.com/api.php?metal=' + metal + '&startDate=2013_01';
  });
  urls.forEach(function(url){
    $.getJSON(url, function(response) {
      var metal = response.metal;
      var priceData = slicePriceData(response.price_data, defaultMonthsToShow);
      var config = buildConfig(priceData, metal);
      chartData[metal] = response;
      var container = document.getElementById(metal);
      var canvas = container.querySelector('canvas');
      var ctx = canvas.getContext('2d');
      charts[metal] = new Chart(ctx, config);
      $('.period-selector').show();
    });
  });
}

function slicePriceData(priceData, months) {
  var count = priceData.history.length;
  if (priceData.projection) {
    count += priceData.projection.length;
    return {
      history: priceData.history.slice(count - months),
      projection: priceData.projection
    };
  }
  return {
    history: priceData.history.slice(count - months)
  };
}

function buildConfig(price_data, metal) {
  var history = price_data.history;
  var projection = price_data.projection;
  var combined = (projection) ? history.concat(projection) : history.slice();

  // used to set y-axis
  var allDates = combined.map(function(point){
    return moment(point['year-mo'], 'YYYY_MM').toDate();
  });

  // used to set min/max for y-axis
  var allPrices = combined.map(function(point){
    return point.price;
  });

  var minPrice = Math.min.apply(this, allPrices);
  var maxPrice = Math.max.apply(this, allPrices);

  var actualPrices = history.map(function(point) {
    return point.price;
  });

  var projectedPrices = actualPrices.map(function(price, index) {
    return (index === actualPrices.length -1) ? price : null;
  });

  if (projection) {
    projection.forEach(function(point) {
      actualPrices.push(null);
      projectedPrices.push(point.price);
    });
  }

  var dataset1 = {
    label: 'Actual',
    lineTension: 0,
    lineBorderWidth: 5,
    backgroundColor: customRed,
    borderColor:  customRed,
    data: actualPrices,
    fill: false,
    pointColor: customRed,
    pointStrokeColor: 'rgb(255,255,255,0)',
    pointHoverRadius: 7,
    pointHoverBorderWidth: 5,
    pointHoverBackgroundColor: chartBackgroundColor
  };

  var dataset2 = {
    label: 'Projected',
    lineTension: 0,
    lineBorderWidth: 5,
    backgroundColor: customRed,
    borderColor:  customRed,
    data: projectedPrices,
    fill: false,
    pointColor: customRed,
    pointStrokeColor: 'rgb(255,255,255,0)',
    pointHoverRadius: 7,
    pointHoverBorderWidth: 5,
    pointHoverBackgroundColor: chartBackgroundColor,
    borderDash: [10, 5]
  };

  var datasets = [dataset1];
  if (projection) {
    datasets.push(dataset2);
  }

  var options = {
    layout: {
      padding: chartPadding
    },
    responsive: true,
    title:{
      display:false
    },
    tooltips: {
      yAlign: 'top',
      enabled: true,
      callbacks: {
        label: function(tooltipItem, data) {
          return '$' + parseFloat(tooltipItem.yLabel)
            .toFixed(2)
            .replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }
      },
      backgroundColor: 'rgba(33,36,41, 0.5)',
      displayColors: false
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
    scales: {
      xAxes: [{
        ticks: {
          fontColor: xAxisFontColor,
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
          color: 'white',
          drawBorder: false,
          zeroLineColor: 'white'
        },
        display: true,
        scaleLabel: {
          display: false
        },
        ticks: {
          callback: function(value, index, values) {
            if (index === values.length - 1)  {
              return '$' + parseFloat(minPrice)
                .toFixed(2)
                .replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
            }
            if (index === 0) {
              return '$' + parseFloat(maxPrice)
                .toFixed(2)
                .replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
            }
            return '';
          },
          min: minPrice,
          max: maxPrice,
          fontColor: "#fff"
        }
      }]
    }
  };

  return {
    type: 'line',
    data: {
      pointHitDetectionRadius: 20,
      labels: allDates,
      datasets: datasets
    },
    options: options
  };
}

window.onload = function() {
  getData();
};

$('.period-selector input[type=radio]').on('change', function() {
  var metal = this.name;
  var priceData = chartData[metal].price_data;
  var months = parseInt(this.value, 10);
  var newPriceData = slicePriceData(priceData, months);
  var config = buildConfig(newPriceData, metal);
  var container = document.getElementById(metal);
  var ctx = container.querySelector('canvas');
  ctx.style.backgroundColor = chartBackgroundColor;
  charts[metal].destroy();
  charts[metal] = new Chart(ctx, config);
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
      tooltipEl.innerHTML = "<table></table>";
      container = document.getElementById(metal);
      container.appendChild(tooltipEl);
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
    var tooltipWidth = tooltipEl.clientWidth;
    var tooltipHeight = tooltipEl.clientHeight;

    // get offsets to center and place tooltip above point
    var hOffset = (tooltipWidth / -2) - 20;
    var vOffset = (tooltipHeight * -1) - 20;
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = position.left + hOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + vOffset + tooltipModel.caretY + 'px';
  }
}

// download button
$('.download-button').on('click', function() {
  var metal = $(this).data('metal');
  var container = document.getElementById(metal);
  var ctx = container.querySelector('canvas');
  ctx.toBlob(function(blob) {
    saveAs(blob, "chart_" + metal + ".png");
  });
});

