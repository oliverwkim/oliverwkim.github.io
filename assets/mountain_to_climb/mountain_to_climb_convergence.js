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

function calculateCatchup(lastGDP, lastGDPCatchup, growthRate, catchupRate){
  return Math.log(lastGDPCatchup / lastGDP) / Math.log( (1 + growthRate) / (1 + catchupRate));
}


function updateProjection(lastGDP, lastGDPCatchup, growthRate, catchupRate){

  yearsCatchup = calculateCatchup(lastGDP, lastGDPCatchup, growthRate, catchupRate)

  if (growthRate < catchupRate) {
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

var margin = {top: 50, right: 250, bottom: 60, left: 120},
    width = 1150 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;

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
    var GDP10yrCatchup  = +catchupCountryGDP[catchupCountryGDP.length - 11].rgdpe_pc
    var GDPfirstCatchup   = +catchupCountryGDP[0].rgdpe_pc
   
    var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
    var growth10yrCatchup   = calculateRate(GDP10yrCatchup, lastGDPCatchup, 10)
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

    yearsCatchup = calculateCatchup(GDPlast, lastGDPCatchup, growth10yr, growth10yrCatchup)

    var GDPcatchupyear = GDPlast * Math.pow(1 + growth10yr, yearsCatchup)

    console.log(yearsCatchup)
    console.log(GDPcatchupyear)

    catchupPoint = yearsCatchup + yearlast

    updateProjection(GDPlast, lastGDPCatchup, growth10yr, growth10yrCatchup)
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
      .domain( [100,250000])
      .range([ height, 0 ]);

    svg.append("g")
      .call(d3.axisLeft(y).tickValues([100, 1000, 10000, 100000]).tickFormat(function (d) {
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
        .text("GDP per capita, 2017 US$");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", height + 50)
        .attr("x", width)
        .style("font-size", "16px")
        .text("2019 real GDP per capita (PPP-adjusted) in 2017 USD. Catchup country uses 10-year growth rates by default. Source: PWT v10.");

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


    var catchupline = svg
      .append('g')
      .append("path")
        .datum(catchupCountryGDP.filter(function(d){  return d.year > yearMinus10  }) )
        .attr("d", d3.line()
          .x(function(d) { return x(+d.year) })
          .y(function(d) { return y(+d.rgdpe_pc) })
        )
        .attr("stroke", "gray")
        .style("stroke-width", 4)
        .style("fill", "none");

    // trend line

    var catchuptrendline = svg.append('line')
      .style("stroke", "lightgray")
      .style("stroke-width", 2)
      .style("stroke-dasharray", ("3, 3"))
      .attr("x1", x(yearMinus10) )
      .attr("y1", y(GDP10yrCatchup) )
      .attr("x2", x(catchupPoint))
      .attr("y2", y(GDPcatchupyear) ); 

    // trend line
    var trendline = svg.append('line')
      .style("stroke", "#DC2828")
      .style("stroke-width", 2)
      .style("stroke-dasharray", ("3, 3"))
      .attr("x1", x(yearMinus10) )
      .attr("y1", y(GDP10yr) )
      .attr("x2", x(catchupPoint))
      .attr("y2", y(GDPcatchupyear) ); 

    var targetlabel = svg.append("text")
        .attr("x", x(yearMinus10) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry)

    var countryLabel = svg.append("text")
        .attr("x", x(yearMinus10) + 10)
        .attr("y", y(GDP10yr) -20)       
        .style("font-size", "16px")
        .style("fill", "#DC2828")
        .attr("dy", "0em")
        .text(selectedCountry)

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
        .attr("y", y(GDPcatchupyear) - 10)       
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
      var GDP10yrCatchup  = +catchupCountryGDP[catchupCountryGDP.length - 11].rgdpe_pc
      var GDPfirstCatchup   = +catchupCountryGDP[0].rgdpe_pc
     
      var growth10yr   = calculateRate(GDP10yr, GDPlast, 10)
      var growth10yrCatchup   = calculateRate(GDP10yrCatchup, lastGDPCatchup, 10)
      var growthAll   = calculateRate(GDPfirst, GDPlast, yearlast - yearfirst)

      growthRates = [growth10yr, 
                      growthAll, 
                      GermanMiracle, 
                      ChineseMiracle, 
                      JapaneseMiracle];

      growthRateNum = growthRates[growthOptions.indexOf(growthRate)]

      yearsCatchup = calculateCatchup(GDPlast, lastGDPCatchup, growthRateNum, growth10yrCatchup)

      var GDPcatchupyear = GDPlast * Math.pow(1 + growthRateNum, yearsCatchup)

      updateProjection(GDPlast, lastGDPCatchup, growthRateNum, growth10yrCatchup)


      // Give these new data to update line
      switch(growthRate){
        case "recent 10-year growth rates":
          startYear = yearMinus10;
          y1 = GDP10yr;
          trendlineStartYear = startYear;

          startGDP = GDP10yr;
        break;

        case "average historical growth rates":
          x1 = yearfirst;
          y1 = GDPfirst;

          startYear = yearfirst;
          trendlineStartYear = startYear;
          startGDP = GDPfirst;
        break;

        case getFlagEmoji('DE') + ' German miracle rates (1950-73)':
        case getFlagEmoji('CN') + ' Chinese miracle rates (1978-2012)':
        case getFlagEmoji('JP') + ' Japanese miracle rates (1950-73)':
          startYear = yearMinus10;
          y1 = GDPlast;

          trendlineStartYear = yearlast;

        break;


      }

      if(yearsCatchup > 0){
          catchupPoint = yearsCatchup + yearlast
      }
      else {
          catchupPoint = 2030
      }

      catchupGDPstartyear = catchupCountryGDP.filter( function(d){  return d.year == startYear  } )
      catchupGDPstartyear = catchupGDPstartyear[0].rgdpe_pc

      catchupGDPendyear = catchupCountryGDP.filter( function(d){  return d.year == catchupPoint  } )
      catchupGDPendyear = catchupGDPstartyear[0].rgdpe_pc

      x.domain([startYear, catchupPoint]);


      if(GDPcatchupyear > 250000){
        y.domain( [100, GDPcatchupyear])

      }
      else {
        y.domain( [100, 250000])

      }

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

      catchupline
          .datum(catchupCountryGDP.filter(function(d){  return d.year > startYear  }) )
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .defined(function(d) { return d.rgdpe_pc != 0; })
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y(d.rgdpe_pc) })
          )
          .attr("stroke", "gray")

       catchuptrendline
        .transition()
        .style("stroke", "lightgray")
        .style("stroke-width", 2)
        .style("opacity", 1)
        .style("stroke-dasharray", ("3, 3"))
        .attr("x1", x(yearMinus10) )
        .attr("y1", y(GDP10yrCatchup) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(catchupGDPendyear) ); 


      // trend line
      if(yearsCatchup > 0){
        trendline
        .transition()
        .style("stroke", "#DC2828")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 1)
        .attr("x1", x(trendlineStartYear) )
        .attr("y1", y(y1) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(GDPcatchupyear) ); 

        catchupLabel
        .attr("x", x(catchupPoint) -   15)
        .attr("y", y(GDPcatchupyear) - 10)       
        .style("font-size", "16px")
        .attr("dy", "0em")
        .style("fill", "gray")
        .html(Math.round(catchupPoint))


          console.log('will catchup')
      }
      else if (growthRate != "recent 10-year growth rates" && growthRate != "average historical growth rates"){
        trendline.style('opacity', 0);
        catchupLabel.html('');

      }
      else {
        trendline
        .transition()
        .style("stroke", "lightgray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 1)
        .attr("x1", x(trendlineStartYear) )
        .attr("y1", y(startGDP) )
        .attr("x2", x(yearlast))
        .attr("y2", y(GDPlast) ); 

        catchupLabel.html('');
      }

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

      countryLabel
        .attr("x", x(startYear) + 10)
        .attr("y", y(y1) -20)       
        .style("font-size", "16px")
        .style("fill", "#DC2828")
        .attr("dy", "0em")
        .text(selectedCountry)

      targetlabel
        .attr("x", x(startYear) + 10)
        .attr("y", y(catchupGDPstartyear) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": " + round2Digit(growth10yrCatchup * 100) + "%/yr")


      svg.select("g")
        .transition()
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d"))).attr("class", "axis");

      svg.select(".y.axis")
        .call(d3.axisLeft(y).tickValues([100, 1000, 10000, 100000]).tickFormat(function (d) {
          return y.tickFormat(4, d3.format(",d"))(d) }))


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
    }

})