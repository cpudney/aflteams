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

// Binning of data for histograms.
//
// data: the data to bin
// valueFn: data accessor functions
//
// Return the binned data.
//
function _binData(data, valueFn) {

  // Bin scale.
  var x = d3.scaleLinear().range([0, height]);
  x.domain(d3.extent(data, valueFn)).nice();

  // Counts scale.
  var y = d3.scaleLinear().range([0, width]);

  // Define histogram.
  var histogram = d3.histogram()
    .value(valueFn)
    .domain(x.domain())
    .thresholds(x.ticks(12));

  // Nest by team.
  var nest = d3.nest()
    .key(function (d) { return d.Team; })
    .entries(data);

  // Apply histogram generator to each team's values.
  var teams = nest.map(function (d) {
    return {
      key: d.key,
      values: histogram(d.values),
      average: d3.mean(d.values, valueFn)
    };
  })

  // Calculate max for each team.
  var teamMax = teams.map(function (d) {
    return {
      team: d.key,
      max: d3.max(d.values, function (s) { return s.length; })
    };
  });

  // Set counts domain.
  y.domain([0, d3.max(teamMax, function (d) { return d.max; })]).nice();

  return {
    'x': x,
    'y': y,
    'teams': teams
  }
}

function plotCharts(data, scales, id) {

  // Add SVG.
  var w = width + margin.left + margin.right;
  var svg = d3.select(id)
    .append("svg")
    .attr("width", w * data.length)
    .attr("height", 4 * (height + margin.bottom) + margin.top);

  var g = svg.selectAll(g)
    .data(data)
    .enter()
    .append("g")
    .attr("transform", function (d, i) { return "translate(" + w * i + ",0)" });

  // Team labels.
  g.append("text")
    .attr("class", "team label")
    .attr("x", margin.left)
    .attr("y", margin.top / 2)
    .attr("font-size", "1.0em")
    .text(function (d) { return d.key; });

  // Histograms.
  var col = g.append("g")
    .attr("class", "hist")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var h = height + margin.bottom;
  plotHistogram('age', scales,
    col.append("g")
      .attr("transform", "translate(0,0)"));
  plotHistogram('games', scales,
    col.append("g")
      .attr("transform", "translate(0," + h + ")"));
  plotHistogram('height', scales,
    col.append("g")
      .attr("transform", "translate(0," + 2 * h + ")"));
  plotHistogram('weight', scales,
    col.append("g")
      .attr("transform", "translate(0," + 3 * h + ")"));

  return g;
}

function sortCharts(sel) {
  console.log("sorting...");
  var w = width + margin.left + margin.right;
  sel.sort(function (a, b) {
    return d3.ascending(Math.random(), Math.random());
  })
    .transition().duration(500)
    .attr("transform", function (d, i) { return "translate(" + w * i + ",0)" });
}

function plotHistogram(key, scales, el) {

  // X-axis
  var x = scales[key].x;
  el.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisLeft(x).ticks(4));

  // Y-axis.
  var y = scales[key].y;
  el.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisTop(y).ticks(4));

  // Histogram bars.
  var bars = el.selectAll(".bar")
    .data(function (d) {
      return d[key].values.map(
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
    .attr("fill", function (s) { return clr(s.team); });
}

// Margins.
var margin = { top: 70, right: 5, bottom: 40, left: 30 },
  width = 100 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

// Colours - from colorgorical: http://vrl.cs.brown.edu/color
var palette = ["rgb(180,221,212)", "rgb(12,95,49)", "rgb(82,220,188)", "rgb(159,33,8)", "rgb(44,228,98)", "rgb(157,13,108)", "rgb(163,215,30)", "rgb(62,60,141)", "rgb(135,169,253)", "rgb(16,75,109)", "rgb(251,93,231)", "rgb(39,15,226)", "rgb(217,146,226)", "rgb(20,143,174)", "rgb(246,187,134)", "rgb(124,68,14)", "rgb(244,212,3)", "rgb(255,77,130)"]

// Colour scale.
var clr = d3.scaleOrdinal().range(palette);

// Read the data set.
d3.csv("players.csv", function (d) {
  // Process fields.
  d.Games = Number(d.Games);
  d.Jumper = Number(d.Jumper);
  d.Weight = Number(d.Weight);
  d.Height = Number(d.Height);
  d.DoB = new Date(d.DoB);
  d.Age = _calculateAge(d.DoB);
  return d;

}).then(function (data) {

  // Map team colours.
  var keys = d3.map(data, function (d) { return d.Team; }).keys();
  clr.domain(keys);

  // Bin data.
  var age = _binData(data, function (d) { return d.Age; });
  var height = _binData(data, function (d) { return d.Height; });
  var weight = _binData(data, function (d) { return d.Weight; });
  var games = _binData(data, function (d) { return d.Games; });

  // Combine arrays.
  var teams = {};
  keys.forEach(function (el) { teams[el] = { key: el } });
  age.teams.forEach(function (el) {
    teams[el.key].age = {
      'values': el.values,
      'average': el.average
    }
  });

  height.teams.forEach(function (el) {
    teams[el.key].height = {
      'values': el.values,
      'average': el.average
    }
  });

  weight.teams.forEach(function (el) {
    teams[el.key].weight = {
      'values': el.values,
      'average': el.average
    }
  });

  games.teams.forEach(function (el) {
    teams[el.key].games = {
      'values': el.values,
      'average': el.average
    }
  });

  // Axis scales.
  var scales = {};
  scales['age'] = { x: age.x, y: age.y };
  scales['games'] = { x: games.x, y: games.y };
  scales['height'] = { x: height.x, y: height.y };
  scales['weight'] = { x: weight.x, y: weight.y };

  // Data values.
  values = Object.values(teams);
  values.sort(function (a, b) { return d3.ascending(a.games.average, b.games.average) })

  // Plot histograms.
  var charts = plotCharts(values, scales, "#chart1");

  d3.select("#sort").on("click", function () { sortCharts(charts) });
});