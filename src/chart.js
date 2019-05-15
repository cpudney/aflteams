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

var margin = { top: 70, right: 50, bottom: 40, left: 30 },
  width = 300 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

// Bin axis.
var x = d3.scaleLinear()
  .range([0, width]);

// Y scale for histograms
var y = d3.scaleLinear()
  .range([height, 0]);

// Read the data set.
d3.csv("players.csv", function (d) {
  // Process fields.
  d.Games = Number(d.Games);
  d.Jumper = Number(d.Jumper);
  d.DoB = new Date(d.DoB);
  d.Age = _calculateAge(d.DoB);
  return d;
}).then(function (data) {
  console.log(data);

  // Define histogram.
  var histogram = d3.histogram()
    .value(function (d) { return d.Games; })
    .domain(x.domain())
    .thresholds(x.ticks(10));

  // Nest by team.
  var nest = d3.nest()
    .key(function (d) { return d.Team; })
    .entries(data);

  // Apply histogram generator to each team's values.
  var teams = nest.map(function (d) {
    return {
      key: d.key,
      values: histogram(d.values)
    }
  });

  // Calculate max for each team.
  var teamMax = teams.map(function (d) {
    return {
      region: d.key,
      max: d3.max(d.values, function (s) {
        return s.length;
      })
    }
  })

  // Set domains.
  x.domain(d3.extent(data, function (d) { return d.Games; }));
  y.domain([0, d3.max(teamMax, function (d) { return d.max; })]);

});