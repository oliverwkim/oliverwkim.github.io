// https://www.d3-graph-gallery.com/graph/line_basic.html
// https://www.d3-graph-gallery.com/graph/line_select.html


function calculateRate (start, end, years){
  return Math.pow(end / start, 1 / years) - 1
}

function calculateYears (start, end, rate){
  return Math.log(end / start) / Math.log(1 + rate)
}

function updateProjection(lastGDP, lastGDPCatchup, growthRate){
  var growthRateText = Math.round(+growthRate * 100 * 10 ) / 10

  if (growthRate < 0 && +lastGDP < +lastGDPCatchup) {
      d3.select("#projection").html("Never at current rates. ")
  } 
  else if (+lastGDP >= +lastGDPCatchup) {
      d3.select("#projection").html("Already richer. ")
  }
  else {
    d3.select("#projection").html("<strong>" + Math.round(calculateYears(lastGDP, lastGDPCatchup, growthRate)) + "</strong> years")
  }
}

function getFlagEmoji(countryCode) {
  var codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

var margin = {top: 10, right: 100, bottom: 30, left: 100},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svg = d3.select("#forecasts")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

d3.csv("http://oliverwkim.com/assets/mountain_to_climb/pwt_10.csv", 

  function(data) {

    // get country names
    countries = d3.map(data, function(d){return d.country;}).keys()
    flags = d3.map(data, function(d){return getFlagEmoji(d.iso2c);}).keys()

    var selectedCountry = "Kenya"
    var catchupCountry = "United States"

    selectedCountryGDP = data.filter(function(row){ 
        return row.country == selectedCountry;
    });

    catchupCountryGDP = data.filter(function(row){ 
        return row.country == catchupCountry;
    });

    // grab most recent GDP value
    var GDP30yr  = +selectedCountryGDP[selectedCountryGDP.length - 31].rgdpe_pc
    var GDP10yr  = +selectedCountryGDP[selectedCountryGDP.length - 11].rgdpe_pc
    var GDPlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].rgdpe_pc

    var lastGDPCatchup = +catchupCountryGDP[catchupCountryGDP.length - 1].rgdpe_pc

    var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
    var growth30yr   = calculateRate(GDP30yr, GDPlast, 30)

    growthOptions = ['recent 10-year growth rates', 
                     'recent 30-year growth rates',
                      getFlagEmoji('CN') + ' Chinese miracle growth rates'];

    growthRates = [growth10yr, growth30yr, 0.07];

    updateProjection(GDPlast, lastGDPCatchup, growth10yr)
    makeButtons(selectedCountry, catchupCountry, 'recent 10-year growth rates');
    updateButtons();

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
      .domain(countries)
      .range(d3.schemeSet2);

    svg.style("font", "30px 'Lato', sans-serif");

    // Add X axis
    var x = d3.scaleLinear()
      .domain([1950,2020])
      .range([ 0, width ]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))).attr("class", "axis");

    // Add Y axis
    var y = d3.scaleLog()
      .domain( [100,100000])
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function (d) {
        return y.tickFormat(4, d3.format(",d"))(d) })).attr("class", "axis");

    // Initialize line
    var line = svg
      .append('g')
      .append("path")
        .datum(selectedCountryGDP)
        .attr("d", d3.line()
          .x(function(d) { return x(+d.year) })
          .y(function(d) { return y(+d.rgdpe_pc) })
        )
        .attr("stroke", function(d){ return myColor(selectedCountry) })
        .style("stroke-width", 4)
        .style("fill", "none");


    // A function that updates the chart
    function update(selectedCountry, catchupCountry, growthRate) {

      selectedCountryGDP = data.filter(function(row){ 
          return row.country == selectedCountry;
      });

      catchupCountryGDP = data.filter(function(row){ 
          return row.country == catchupCountry;
      });

      // grab most recent GDP value
      var GDP30yr  = +selectedCountryGDP[selectedCountryGDP.length - 31].rgdpe_pc
      var GDP10yr  = +selectedCountryGDP[selectedCountryGDP.length - 11].rgdpe_pc
      var GDPlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].rgdpe_pc

      var lastGDPCatchup = +catchupCountryGDP[catchupCountryGDP.length - 1].rgdpe_pc

      var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
      var growth30yr   = calculateRate(GDP30yr, GDPlast, 30)

      growthRates = [growth10yr, growth30yr, 0.07];

      // Give these new data to update line
      line
          .datum(selectedCountryGDP)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .defined(function(d) { return d.rgdpe_pc != 0; })
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y(d.rgdpe_pc) })
          )
          .attr("stroke", function(d){ return myColor(selectedCountry) })

      growthRateNum = growthRates[growthOptions.indexOf(growthRate)]

      // update everything
      updateProjection(GDPlast, lastGDPCatchup, growthRateNum);
      //makeButtons(selectedCountry, catchupCountry, growthRate);
      updateButtons();
    }

    function makeButtons (selectedCountry, catchupCountry, growthRate){
      d3.select("#selectCountry")
        .selectAll('myOptions')
        .data(countries)
        .enter()
        .append('option')
        .text(function (d) { return flags[countries.indexOf(d)] + ' ' + d; }) 
        .attr("value", function (d) { return d; })
        .property("selected", function(d){ return d === selectedCountry}); 

      d3.select("#catchupCountry")
        .selectAll('myOptions')
        .data(countries)
        .enter()
        .append('option')
        .text(function (d) { return flags[countries.indexOf(d)] + ' ' + d; }) 
        .attr("value", function (d) { return d; })
        .property("selected", function(d){ return d === catchupCountry}); 

      d3.select('#growthRates')
        .selectAll('myOptions')
        .data(growthOptions)
        .enter()
        .append('option')
        .text(function (d) { return d; }) 
        .attr("value", function (d) { return d; })
        .property("selected", function(d){ return d === growthRate}); 
 
    }


    function updateButtons (){

        // When the button is changed, run the updateChart function
        d3.selectAll("#selectCountry, #catchupCountry, #growthRates").on("change", function(d) {

            // recover the options that have been chosen
            var selectedOption = d3.select("#selectCountry").property("value")
            var catchupCountry = d3.select("#catchupCountry").property("value")
            var growthRate = d3.select("#growthRates").property("value")

            // run the updateChart function with this selected option
            update(selectedOption, catchupCountry, growthRate)
        });

    }




})