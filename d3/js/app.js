
function parseData(data) {
  var numberOfItems = data.length;
  var period = parseInt($("input[name='period']:checked").val());
  return data.slice(numberOfItems - period);
}

var formatTime = d3.time.format("%b %Y");

// Set the dimensions of the canvas / graph
var margin = {top: 75, right: 50, bottom: 75, left: 75},
  width = 900 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// Parse the date/time of incoming data
var parseDate = d3.time.format("%Y_%m").parse;

// Set the ranges
var xScale = d3.time.scale().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);

var yAxis2 = d3.svg.axis()
  .outerTickSize(0)
  .tickValues([])
  .scale(yScale)
  .orient("right");

// Define the line
var valueline = d3.svg.line()
  .x(function(d) { return xScale(d.date); })
  .y(function(d) { return yScale(d.price); });


// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
  .attr("class", "custom-tooltip")
  .style("opacity", 0);

// Adds the svg canvas
var svg = d3.select("body")
  .append("svg")
    .attr("class", "graph-svg-component")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.json("../data/alum.json", function(error, rawData) {
  data = parseData(rawData);
  data.forEach(function(d) {
    d.date = parseDate(d.date);
    d.price = +d.alum;
  });

  var priceMin = d3.min(data, function(d) { return d.price; });
  var priceMax = d3.max(data, function(d) { return d.price; });

  // Scale the range of the data
  xScale.domain(d3.extent(data, function(d) { return d.date; }));
  yScale.domain([priceMin - priceMin * 0.07, priceMax + priceMax * 0.09]);

  var xAxis = d3.svg.axis().scale(xScale)
    .orient("bottom")
    .tickValues(xScale.domain())
    .tickFormat(formatTime);

  var yAxis = d3.svg.axis()
    .outerTickSize(0)
    .scale(yScale)
    .orient("left")
    .tickValues([priceMin, priceMax])
    .tickFormat(d3.format("$,"));



  // Add the valueline path.
  svg.append("path")
    .attr("class", "line")
    .attr("d", valueline(data));


  svg.selectAll(".dot")
    .data(data)
    .enter()
      .append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d) { return xScale(d.date) })
      .attr("cy", function(d) { return yScale(d.price) })
      .attr("r", 8)
      .on("mouseover", function(d) {
        d3.select(this).style({opacity: 1});
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        var dateHtml = '<div class="date">' + formatTime(d.date) + '</div>';
        var priceHtml = '<div class="price">' + d3.format("$,")(d.price) + '</div>';
        tooltip.html(dateHtml + priceHtml)
          .style("left", (xScale(d.date) + 8) + "px")
          .style("top", (yScale(d.price) + margin.top - 40) + "px");
      })
      .on("mouseout", function(d) {
        d3.select(this).style({opacity: 0});
        tooltip.transition()
          .duration(200)
          .style({opacity: 0})
      });

  // Add the X Axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Add the Y Axis
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);


  svg.append("g")
    .classed("y axis", true)
    .attr("transform", "translate(" + width + ",0)")
    .call(yAxis2);

});

