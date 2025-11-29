// https://www.d3-graph-gallery.com/graph/line_basic.html
// https://www.d3-graph-gallery.com/graph/line_select.html

/*
  Note: I processed the PWT 11 data to create GDP per capita (rgdpe_pc)
  and changed the name of "United States" to "the United States" to look better
*/


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
  if (!countryCode) return ''; // Return empty string if countryCode is undefined/null
  
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
var JapaneseMiracle = 0.079924659 // 1950-1973
var ChineseMiracle = 0.08062386846 // 1978-2012



d3.csv("https://oliverwkim.com/assets/mountain_to_climb/pwt_110.csv", 

  function(data) {
    // Extract unique countries and their ISO codes
    var countryData = {};
    data.forEach(function(d) {
        if (d.country && d.iso2c && !countryData[d.country]) {
            countryData[d.country] = d.iso2c;
        }

        d.year = +d.year;          // The "+" converts "2019" to 2019
        d.rgdpe_pc = +d.rgdpe_pc;  // Good practice to ensure this is a number too
    });

    countries = Object.keys(countryData);
    flags = countries.map(function(country) {
        return getFlagEmoji(countryData[country]);
    });

    console.log('Countries:', countries.length);
    console.log('Sample countries:', countries.slice(0, 5));


    var selectedCountry = "Kenya"
    var catchupCountry = "the United States"
    var growthRate = "recent 10-year growth rates"

    // if in URL, use these instead
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    // Check if a parameter exists
    if (params.has('selectedCountry')) {
      selectedCountry = params.get('selectedCountry');
    } 
    if (params.has('catchupCountry')) {
      catchupCountry = params.get('catchupCountry');
    } 
    if (params.has('growthRate')) {
      growthRate = params.get('growthRate');
    } 

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
                      getFlagEmoji('JP') + ' Japanese miracle rates (1950-73)',
                      getFlagEmoji('CN') + ' Chinese miracle rates (1978-2012)'];

    growthRates = [growth10yr, 
                    growthAll, 
                    GermanMiracle,  
                    JapaneseMiracle,
                    ChineseMiracle];

    yearsCatchup = calculateYears(GDPlast, lastGDPCatchup, growth10yr)

    catchupPoint = yearsCatchup + yearlast

    updateProjection(GDPlast, lastGDPCatchup, yearsCatchup)
    makeButtons(selectedCountry, catchupCountry, growthRate);
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
        .text("2019 real GDP per capita (PPP-adjusted) in 2017 USD. Source: PWT v10.");

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

      const params = new URLSearchParams(window.location.search);

      // Add or update the desired parameter(s)
      params.set('selectedCountry', selectedCountry);
      params.set('catchupCountry', catchupCountry);
      params.set('growthRate', growthRate);

      // Create a new URL object with the updated search parameters
      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();

      // Update the URL in the browser without refreshing the page
      history.pushState({}, '', newUrl);


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
      if(yearsCatchup > 0){
        trendline
        .transition()
        .style("stroke", "lightgray")
        .style("stroke-width", 2)
        .style("stroke-dasharray", ("3, 3"))
        .style("opacity", 1)
        .attr("x1", x(trendlineStartYear) )
        .attr("y1", y(y1) )
        .attr("x2", x(catchupPoint))
        .attr("y2", y(lastGDPCatchup) ); 


        catchupLabel
            .attr("x", x(catchupPoint) -   15)
            .attr("y", y(lastGDPCatchup) - 10)       
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

      targetlabel
        .transition()
        .style("opacity", 1)
        .attr("x", x(startYear) + 10)
        .attr("y", y(lastGDPCatchup) -10)       
        .style("font-size", "16px")
        .style("fill", "gray")
        .attr("dy", "0em")
        .text(catchupCountry + ": $" + numberWithCommas(Math.round(lastGDPCatchup)))


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
                var growthRate =  getFlagEmoji('CN') + ' Chinese miracle rates (1978-2012)'
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



        d3.select("#downloadBtn").on("click", function() {
          
            // 1. Generate Dynamic Filename
            var selected = d3.select("#selectCountry").property("value");
            var catchup = d3.select("#catchupCountry").property("value");
            // Clean up names for filenames (remove spaces and non-alphanumeric characters)
            var cleanSelected = selected.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "");
            var cleanCatchup = catchup.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "");
            var filename = "Projection_" + cleanSelected + "_vs_" + cleanCatchup + ".png";


            // 2. Select the SVG using D3 so we can modify it
            var svgSelection = d3.select("#forecasts svg");
            var svgNode = svgSelection.node(); // The raw HTML node needed for the save function


            // --- THE "SURGICAL STRIKE" ---

            // A. Remember the current state on the webpage so we can restore it later.
            var originalWidthAttr = svgSelection.attr("width");
            var originalMarginLeftStyle = svgSelection.style("margin-left");


            // B. Temporarily apply fixes JUST for the PNG export.

            // Fix Left Cutoff: Your CSS shifts the chart 120px left.
            // The exporter clips this. We reset it to 0 temporarily.
          svgSelection.style("margin-left", "0px");

          // Fix Right Empty Space: Your code defines a huge 250px right margin.
          // We temporarily reduce the total declared width of the SVG to lop off that space.
          // We subtract 220px, leaving a small 30px buffer so right-side labels don't get clipped.
          var newTightWidth = parseInt(originalWidthAttr) - 220;
          svgSelection.attr("width", newTightWidth);


          // C. Set export options (high resolution, white background)
          var options = {
              scale: 3,               // 3x scale for very crisp text
              backgroundColor: "white",
              encoderOptions: 1.0,
              // Tell the exporter to respect the temporary dimensions we just set
              width: newTightWidth,
              height: svgSelection.attr("height")
          };

          // D. Trigger download, and immediately RESTORE the webpage state.
          saveSvgAsPng(svgNode, filename, options).then(function() {
              // This runs the millisecond after the image snapshot is taken.
              // Put everything back exactly how it was so the webpage looks unchanged.
              svgSelection.attr("width", originalWidthAttr);
              svgSelection.style("margin-left", originalMarginLeftStyle);
          });
      });     

    }




})