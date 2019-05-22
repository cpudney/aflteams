// Calculate age in years given birth date.
//
// Date dob: date of birth.
//
// Return: age in years.
//
function _calculateAge(dob) {
  var diffMs = Date.now() - dob.getTime();
  var ageDate = new Date(diffMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

var margin = { top: 70, right: 5, bottom: 40, left: 30 },
  width = 100 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

// Bin axis.
var x = d3.scaleLinear().range([0, height]);

// Count axis.
var y = d3.scaleLinear().range([0, width]);

// Colour scale.
var clr = d3.scaleOrdinal().range(d3.schemeSet3);

// Read the data set.
d3.csv("players.csv", function (d) {
  // Process fields.
  d.Games = Number(d.Games);
  d.Jumper = Number(d.Jumper);
  d.DoB = new Date(d.DoB);
  d.Age = _calculateAge(d.DoB);
  return d;
}).then(function (data) {

  x.domain(d3.extent(data, function (d) { return d.Games; }));

  // Define histogram.
  var histogram = d3.histogram()
    .value(function (d) { return d.Games; })
    .domain(x.domain())
    .thresholds(x.ticks(15));

  // Nest by team.
  var nest = d3.nest()
    .key(function (d) { return d.Team; })
    .entries(data);

  // Apply histogram generator to each team's values.
  var teams = nest.map(function (d) {
    return {
      key: d.key,
      values: histogram(d.values),
      average: d3.mean(d.values, function (s) { return s.Games; })
    }
  })
    .sort(function (x, y) { return d3.ascending(x.average, y.average); });


  console.log(teams);

  // Calculate max for each team.
  var teamMax = teams.map(function (d) {
    return {
      team: d.key,
      max: d3.max(d.values, function (s) { return s.length; })
    }
  })

  // Set domains.
  y.domain([0, d3.max(teamMax, function (d) { return d.max; })]);
  clr.domain(teams.map(function (d) { return d.key }));

  // for each region, set up a svg with axis and label
  var svg = d3.select("#chart").selectAll("svg")
    .data(teams)
    .enter()
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  svg.append("text")
    .attr("class", "team label")
    .attr("x", margin.left)
    .attr("y", margin.top / 2)
    .attr("font-size", "1.0em")
    .text(function (d) { return d.key; })

  var hist = svg.append("g")
    .attr("class", "hist")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  hist.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisLeft(x).ticks(4));

  hist.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisTop(y).ticks(4));

  // Histogram bars
  var bars = hist.selectAll(".bar")
    .data(function (d) {
      return d.values.map(
        // Add team name to values.
        function (s) { s.team = d.key; return s; });
    })
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", function (s) {
      return "translate(0," + x(s.x0) + ")";
    });

  bars.append("rect")
    .attr("x", 1)
    .attr("y", 1)
    .attr("height", function (s) { return x(s.x1) - x(s.x0); })
    .attr("width", function (s) { return y(s.length); })
    .attr("fill", function (s) { return clr(s.team) });

});