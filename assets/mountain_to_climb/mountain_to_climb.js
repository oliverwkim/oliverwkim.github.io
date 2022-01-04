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

function numberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


function updateProjection(lastGDP, lastGDPCatchup, yearsCatchup){

  if (yearsCatchup < 0 && +lastGDP < +lastGDPCatchup) {
      d3.select("#projection").html("Never. ")
  } 
  else if (+lastGDP > +lastGDPCatchup) {
      d3.select("#projection").html("Already richer. ")
  }
  else if (lastGDP === lastGDPCatchup) {
      d3.select("#projection").html("Already there. ")
  }
  else {
    d3.select("#projection").html("<strong>In " + Math.round(yearsCatchup) + "</strong> years.")
  }
}

function getFlagEmoji(countryCode) {
  var codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

var margin = {top: 20, right: 250, bottom: 60, left: 120},
    width = 1150 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#forecasts")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", "-120px")
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var TaiwaneseMiracle = 0.051376746 // 1951-2019
var GermanMiracle = 0.057242325 // 1950-1973
var ChineseMiracle = 0.067037168 // 1978-2012
var JapaneseMiracle = 0.079924659 // 1950-1973


d3.csv("http://oliverwkim.com/assets/mountain_to_climb/pwt_10.csv", 

  function(data) {

    // get country names
    countries = d3.map(data, function(d){return d.country;}).keys()
    flags = d3.map(data, function(d){return getFlagEmoji(d.iso2c);}).keys()

    var selectedCountry = "Kenya"
    var catchupCountry = "the United States"

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
    var yearlast   = +selectedCountryGDP[selectedCountryGDP.length - 1].year
    var yearMinus10   = yearlast - 10

    var lastGDPCatchup = +catchupCountryGDP[catchupCountryGDP.length - 1].rgdpe_pc

    var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
    var growthAll   = calculateRate(GDPfirst, GDPlast, yearlast - yearfirst)

    growthOptions = ['recent 10-year growth rates', 
                     'average historical growth rates',
                      getFlagEmoji('DE') + ' German miracle rates (1950-73)',
                      getFlagEmoji('CN') + ' Chinese miracle rates (1978-2012)',
                      getFlagEmoji('JP') + ' Japanese miracle rates (1950-73)'];

    growthRates = [growth10yr, 
                    growthAll, 
                    GermanMiracle, 
                    ChineseMiracle, 
                    JapaneseMiracle];

    yearsCatchup = calculateYears(GDPlast, lastGDPCatchup, growth10yr)

    catchupPoint = yearsCatchup + yearlast

    updateProjection(GDPlast, lastGDPCatchup, yearsCatchup)
    makeButtons(selectedCountry, catchupCountry, 'recent 10-year growth rates');
    updateButtons();

    // A color scale: one color for each group
    svg.style("font", "30px 'Lato', sans-serif");

    // Add X axis
    var x = d3.scaleLinear()
      .domain([yearMinus10, catchupPoint])
      .range([ 0, width ]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d"))).attr("class", "axis");

    // Add Y axis
    var y = d3.scaleLog()
      .domain( [100,100000])
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function (d) {
        return y.tickFormat(4, d3.format(",d"))(d) })).attr("class", "axis");

    // axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -margin.top + 30)
        .attr("dy", ".75em")
        .style("font-size", "20px")
        .text("Real GDP per capita, PPP-adj. (2017 US$)");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", height + 50)
        .attr("x", width)
        .style("font-size", "16px")
        .text("Data current as of 2019. Source: PWT v10.");

    // Initialize line
    var line = svg
      .append('g')
      .append("path")
        .datum(selectedCountryGDP.filter(function(d){  return d.year > yearMinus10  }) )
        .attr("d", d3.line()
          .x(function(d) { return x(+d.year) })
          .y(function(d) { return y(+d.rgdpe_pc) })
        )
        .attr("stroke", "#DC2828")
        .style("stroke-width", 4)
        .style("fill", "none");


    // trend line
    var trendline = svg.append('line')
      .style("stroke", "lightgray")
      .style("stroke-width", 2)
      .style("stroke-dasharray", ("3, 3"))
      .attr("x1", x(yearMinus10) )
      .attr("y1", y(GDP10yr) )
      .attr("x2", x(catchupPoint))
      .attr("y2", y(lastGDPCatchup) ); 

    var targetline = svg.append('line')
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(yearMinus10) )
        .attr("y1", y(lastGDPCatchup) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(lastGDPCatchup) ); 

    var targetlabel = svg.append("text")
        .attr("x", x(yearMinus10) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": $" + numberWithCommas(Math.round(lastGDPCatchup)))

    var GDPlabel = svg.append("text")
        .attr("x", x(yearlast) + 10)
        .attr("y", y(GDPlast) + 5)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .html("$" + numberWithCommas(Math.round(GDPlast)))

    var growthLabel = svg.append("text")
        .attr("x", x(yearlast) + 10)
        .attr("y", y(GDPlast) + 25)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .style("fill", "gray")
        .html(Math.round(growth10yr * 100) + "%/yr" )

    var catchupLabel = svg.append("text")
        .attr("x", x(catchupPoint) -   15)
        .attr("y", y(lastGDPCatchup) - 10)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .style("fill", "gray")
        .html(Math.round(catchupPoint))



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
      var growthAll   = calculateRate(GDPfirst, GDPlast, yearlast - yearfirst)


      growthRates = [growth10yr, 
                      growthAll, 
                      GermanMiracle, 
                      ChineseMiracle, 
                      JapaneseMiracle];

      growthRateNum = growthRates[growthOptions.indexOf(growthRate)]

      yearsCatchup = calculateYears(GDPlast, lastGDPCatchup, growthRateNum)
      updateProjection(GDPlast, lastGDPCatchup, yearsCatchup);


      // Give these new data to update line
      switch(growthRate){
        case "recent 10-year growth rates":
          startYear = yearMinus10;
          y1 = GDP10yr;
          trendlineStartYear = startYear;
        break;

        case getFlagEmoji('DE') + ' German miracle rates (1950-73)':
        case getFlagEmoji('CN') + ' Chinese miracle rates (1978-2012)':
        case getFlagEmoji('JP') + ' Japanese miracle rates (1950-73)':
          startYear = yearMinus10;
          y1 = GDPlast;

          trendlineStartYear = yearlast;

        break;

        case "average historical growth rates":
          x1 = yearfirst;
          y1 = GDPfirst;

          startYear = yearfirst;
          trendlineStartYear = startYear;
        break;

      }

      if(yearsCatchup > 0){
          catchupPoint = yearsCatchup + yearlast
      }
      else {
          trendlineStartYear = catchupPoint
          y1 = lastGDPCatchup
          catchupPoint = 0
      }

      x.domain([startYear, catchupPoint]);

      line
          .datum(selectedCountryGDP.filter(function(d){  return d.year > startYear  }) )
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .defined(function(d) { return d.rgdpe_pc != 0; })
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y(d.rgdpe_pc) })
          )
          .attr("stroke", "#DC2828")

      // trend line
      trendline
        .transition()
        .style("stroke", "lightgray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(trendlineStartYear) )
        .attr("y1", y(y1) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(lastGDPCatchup) ); 

        // target line 
      targetline
        .transition()
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(startYear) )
        .attr("y1", y(lastGDPCatchup) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(lastGDPCatchup) ); 

      targetlabel
        .transition()
        .attr("x", x(startYear) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": $" + numberWithCommas(Math.round(lastGDPCatchup)))

      GDPlabel
          .attr("x", x(yearlast) + 10)
          .attr("y", y(GDPlast) + 5)       
          .style("font-size", "16px")
          .attr("dy", "0em")
          .html("$" + numberWithCommas(Math.round(GDPlast)))

      growthLabel
          .attr("x", x(yearlast) + 10)
          .attr("y", y(GDPlast) + 25)       
          .style("font-size", "16px")
          .style("fill", "gray")
          .attr("dy", "0em")
          .html(Math.round(growthRateNum * 100) + "%/yr" )
              // Add X axis
    catchupLabel
            .attr("x", x(catchupPoint) -   15)
            .attr("y", y(lastGDPCatchup) - 10)       
            .style("font-size", "16px")
            .attr("dy", "0em")
            .style("fill", "gray")
            .html(Math.round(catchupPoint))

      svg.select("g")
        .transition()
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d"))).attr("class", "axis");

      // update everything
      //makeButtons(selectedCountry, catchupCountry, growthRate);
      updateButtons();
    }

    function makeButtons (selectedCountry, catchupCountry, growthRate){
        d3.select("#selectCountry, #catchupCountry, #growthRates").selectAll("*").remove();

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
        .html('')
        .append('option')
        .text(function (d) { return flags[countries.indexOf(d)] + ' ' + d; }) 
        .attr("value", function (d) { return d; })
        .property("selected", function(d){ return d === catchupCountry}); 

      d3.select('#growthRates')
        .selectAll('myOptions')
        .data(growthOptions)
        .enter()
        .html('')
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

        d3.selectAll("#example").on("click", function(d) {

            // recover the options that have been chosen
            var selectedOption  = d3.select(this).property("value")

            switch(selectedOption){
              case "the D.R. Congo":
                var catchupCountry = "the United States"
                var growthRate =  getFlagEmoji('CN') + ' Chinese miracle growth rates'
              break;

              case "Guinea-Bissau":
                var catchupCountry = "Portugal"
                var growthRate = "average historical growth rates"
              break;

              case "China":
                var catchupCountry = "the United States"
                var growthRate = 'recent 10-year growth rates'
              break;

              case "Japan":
                var catchupCountry = "the United States"
                var growthRate = 'recent 10-year growth rates'
              break;

              case "Senegal":
                var catchupCountry = "France"
                var growthRate = "average historical growth rates"
              break;
            }

            update(selectedOption, catchupCountry, growthRate)
            makeButtons(selectedOption, catchupCountry, growthRate);

        });



    }




})