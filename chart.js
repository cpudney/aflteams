// Calculate age in years given birth date.
//
// Date dob: date of birth.
//
// Return: age in years.
//
function calculateAge(dob) {
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
function binData(data, valueFn) {

  // Bin scale.
  var x = d3.scaleLinear().range([0, height]);
  x.domain(d3.extent(data, valueFn));

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
  y.domain([0, d3.max(teamMax, function (d) { return d.max; })]);

  return {
    'x': x,
    'y': y,
    'teams': teams
  }
}

function plotCharts(data, scales, id) {

  var w = width + margin.left + margin.right;
  var h = height + margin.bottom;

  // Add SVG.
  var svg = d3.select(id)
    .append("svg")
    .attr("width", w * (1 + data.length))
    .attr("height", 4 * (height + margin.bottom) + margin.top);

  // Category labels.
  var offset = margin.top + height / 2;
  svg.selectAll("text category")
    .data(["Age", "Games", "Height", "Weight"])
    .enter()
    .append("text")
    .attr("class", "category")
    .attr("text-anchor", "middle")
    .attr("transform", function (d, i) { return "rotate(90)translate(" + (offset + h * i) + ",-5)" })
    .text(function (d) { return d });

  var g = svg.selectAll(g)
    .data(data)
    .enter()
    .append("g")
    .attr("transform", function (d, i) { return "translate(" + w * i + ",0)" });

  // Team logos
  g.append("image")
    .attr("x", margin.left)
    .attr("y", "10")
    .attr("height", margin.top * .6)
    .attr("href", function (d) { return "logos/" + d.key.toLowerCase() + ".svg" })
    .attr("title", function (d) { return d.key; });

  // Histograms.
  var col = g.append("g")
    .attr("class", "hist")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  plotHistogram('age', "years", scales,
    col.append("g")
      .attr("transform", "translate(0,0)"));
  plotHistogram('games', "games", scales,
    col.append("g")
      .attr("transform", "translate(0," + h + ")"));
  plotHistogram('height', "mm", scales,
    col.append("g")
      .attr("transform", "translate(0," + 2 * h + ")"));
  plotHistogram('weight', "kg", scales,
    col.append("g")
      .attr("transform", "translate(0," + 3 * h + ")"));

  return g;
}

/**
 * Sort the chart columns by team averages.
 * 
 * @param {Object} sel the root component for the charts.
 * @param {String} key the attribute to sort on, e.g. 'age'
 */
function sortCharts(sel, key) {
  var w = width + margin.left + margin.right;
  sel.sort(function (a, b) {
    return d3.descending(b[key].average, a[key].average);
  })
    .transition().duration(500)
    .attr("transform", function (d, i) { return "translate(" + w * i + ",0)" });
}

function plotHistogram(key, units, scales, el) {

  // X-axis
  var x = scales[key].x;
  el.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisLeft(x).ticks(4).tickSizeOuter(0));

  // Y-axis.
  var y = scales[key].y;
  el.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0,0)")
    .call(d3.axisTop(y).ticks(3).tickSizeOuter(0));

  // Histogram bars.
  var bars = el.selectAll(".bar")
    .data(function (d) { return d[key].values })
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", function (s) {
      return "translate(0," + x(s.x0) + ")";
    });
  bars.append("rect")
    .attr("x", 1)
    .attr("y", 1)
    .attr("height", function (s) { return x(s.x1) - x(s.x0) })
    .attr("width", function (s) { return y(s.length) })

  // Tooltip.
  var tip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Average markers.
  el.append("circle")
    .attr("class", "marker")
    .attr("r", "4px")
    .attr("cx", 0)
    .attr("cy", function (s) { return x(s[key].average) })
    .on("mouseover", function (s) {
      tip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tip.html("Average: " + s[key].average.toFixed(1) + " " + units)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      tip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Margins.
var margin = { top: 80, right: 0, bottom: 30, left: 45 },
  width = 100 - margin.left - margin.right,
  height = 180 - margin.bottom;

// Read the data set.
d3.csv("players.csv", function (d) {
  // Process fields.
  d.Games = Number(d.Games);
  d.Jumper = Number(d.Jumper);
  d.Weight = Number(d.Weight);
  d.Height = Number(d.Height);
  d.DoB = new Date(d.DoB);
  d.Age = calculateAge(d.DoB);
  return d;

}).then(function (data) {

  // Bin data.
  var age = binData(data, function (d) { return d.Age; });
  var height = binData(data, function (d) { return d.Height; });
  var weight = binData(data, function (d) { return d.Weight; });
  var games = binData(data, function (d) { return d.Games; });

  // Combine arrays.
  var teams = {};
  var keys = d3.map(data, function (d) { return d.Team; }).keys();
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

  // Plot histograms.
  var charts = plotCharts(values, scales, "#chart");

  // Sorting.
  d3.select("#age_sort").on("click", function () { sortCharts(charts, 'age') });
  d3.select("#games_sort").on("click", function () { sortCharts(charts, 'games') });
  d3.select("#height_sort").on("click", function () { sortCharts(charts, 'height') });
  d3.select("#weight_sort").on("click", function () { sortCharts(charts, 'weight') });
});