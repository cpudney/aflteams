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
});