// https://www.d3-graph-gallery.com/graph/line_basic.html
// https://www.d3-graph-gallery.com/graph/line_select.html


function calculateRate (start, end, years){
  return Math.pow(end / start, 1 / years) - 1
}

function calculateYears (start, end, rate){
  return Math.log(end / start) / Math.log(1 + rate)
}

function round2Digit (num){
  return Math.round(num * 100 ) / 100
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

var margin = {top: 20, right: 250, bottom: 30, left: 120},
    width = 1150 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;

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

    var GDPfirst   = +selectedCountryGDP[0].rgdpe_pc
    var GDPlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].rgdpe_pc

    var yearfirst   = +selectedCountryGDP[0].year
    var yearlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].year
    var yearMinus10   = yearlast - 10

    var lastGDPCatchup = +catchupCountryGDP[catchupCountryGDP.length - 1].rgdpe_pc

    var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
    var growthAll   = calculateRate(GDPfirst, GDPlast, yearlast - yearfirst)

    growthOptions = ['recent 10-year growth rates', 
                     'average historical growth rates',
                      getFlagEmoji('CN') + ' Chinese miracle growth rates'];

    growthRates = [growth10yr, growthAll, 0.07];

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
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(5)).attr("class", "axis");

    // Add Y axis
    var y = d3.scaleLog()
      .domain( [100,100000])
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function (d) {
        return y.tickFormat(4, d3.format(",d"))(d) })).attr("class", "axis");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top + 20)
        .attr("dy", ".75em")
        .style("font-size", "16px")
        .text("Real GDP per capita (2017 US$)");


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

    y1 = 100;
    x1 = yearlast - 10 * Math.log( GDPlast / 100 ) / Math.log(GDPlast / GDP10yr)

    // trend line
    var trendline = svg.append('line')
      .style("stroke", "lightgray")
      .style("stroke-width", 2)
      .style("stroke-dasharray", ("3, 3"))
      .attr("x1", x(x1) )
      .attr("y1", y(y1) )
      .attr("x2", x(yearlast))
      .attr("y2", y(GDPlast) ); 

    var targetline = svg.append('line')
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(1950) )
        .attr("y1", y(lastGDPCatchup) )
        .attr("x2", x(yearlast))
        .attr("y2", y(lastGDPCatchup) ); 

    var targetlabel = svg.append("text")
        .attr("x", x(1950) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": $" + round2Digit(lastGDPCatchup))

    var GDPlabel = svg.append("text")
        .attr("x", x(yearlast) + 10)
        .attr("y", y(GDPlast) + 5)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .html("$" + round2Digit(GDPlast))

    var growthLabel = svg.append("text")
        .attr("x", x(yearlast) + 10)
        .attr("y", y(GDPlast) + 25)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .style("fill", "gray")
        .html(Math.round(growth10yr * 100) + "%/yr" )



    // A function that updates the chart
    function update(selectedCountry, catchupCountry, growthRate) {

      selectedCountryGDP = data.filter(function(row){ 
          return row.country == selectedCountry;
      });

      catchupCountryGDP = data.filter(function(row){ 
          return row.country == catchupCountry;
      });

      // grab most recent GDP value
      var GDP10yr  = +selectedCountryGDP[selectedCountryGDP.length - 11].rgdpe_pc

      var GDPfirst   = +selectedCountryGDP[0].rgdpe_pc
      var GDPlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].rgdpe_pc

      var yearfirst   = +selectedCountryGDP[0].year
      var yearlast    = +selectedCountryGDP[selectedCountryGDP.length - 1].year
      var yearMinus10 = yearlast - 10

      var lastGDPCatchup = +catchupCountryGDP[catchupCountryGDP.length - 1].rgdpe_pc

      var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
      var growth30yr   = calculateRate(GDP30yr, GDPlast, 30)
      var growthAll   = calculateRate(GDPfirst, GDPlast, yearlast - yearfirst)

      growthRates = [growth10yr, growthAll, 0.07];

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

      switch(growthRate){
        case "recent 10-year growth rates":
          y1 = 100;
          x1 = yearlast - 10 * Math.log( GDPlast / 100 ) / Math.log(GDPlast / GDP10yr);

          if (x1 <= 1950 || x1 > 2020 ){
            x1 = 1950;
            y1 = GDPlast / Math.pow(GDPlast / GDP10yr, (yearlast - 1950) / 10);
          }
        break;

        case getFlagEmoji('CN') + " Chinese miracle growth rates":
        case "average historical growth rates":
          x1 = yearfirst;
          y1 = GDPfirst;
        break;

      }

      // trend line
      trendline
        .transition()
        .style("stroke", "lightgray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(x1) )
        .attr("y1", y(y1) )
        .attr("x2", x(yearlast))
        .attr("y2", y(GDPlast) ); 
        growthRateNum = growthRates[growthOptions.indexOf(growthRate)]

        // target line 
      targetline
        .transition()
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(1950) )
        .attr("y1", y(lastGDPCatchup) )
        .attr("x2", x(yearlast))
        .attr("y2", y(lastGDPCatchup) ); 

      targetlabel
        .transition()
        .attr("x", x(1950) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": $" + round2Digit(lastGDPCatchup))

      GDPlabel
          .attr("x", x(yearlast) + 10)
          .attr("y", y(GDPlast) + 5)       
          .style("font-size", "16px")
          .attr("dy", "0em")
          .html("$" + round2Digit(GDPlast))

      growthLabel
          .attr("x", x(yearlast) + 10)
          .attr("y", y(GDPlast) + 25)       
          .style("font-size", "16px")
          .style("fill", "gray")
          .attr("dy", "0em")
          .html(Math.round(growthRateNum * 100) + "%/yr" )


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
            var selectedOption  = d3.select("#selectCountry").property("value")
            var catchupCountry  = d3.select("#catchupCountry").property("value")
            var growthRate      = d3.select("#growthRates").property("value")

            // run the updateChart function with this selected option
            update(selectedOption, catchupCountry, growthRate)
        });

    }




})