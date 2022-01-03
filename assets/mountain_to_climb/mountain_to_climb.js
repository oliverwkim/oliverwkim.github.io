// https://www.d3-graph-gallery.com/graph/line_basic.html
// https://www.d3-graph-gallery.com/graph/line_select.html


function calculateRate (start, end, years){
  return Math.pow(end / start, 1 / years) - 1
}

function calculateYears (start, end, rate){
  return Math.log(end / start) / Math.log(1 + rate)
}

function updateProjection(lastGDP, lastGDPCatchup, historicalGrowth){
  var historicalGrowthPct = Math.round(historicalGrowth * 100 * 10 ) / 10


  if (historicalGrowth < 0 && lastGDP < lastGDPCatchup) {
      d3.select("#projection").html("At its current growth rate (" + historicalGrowthPct + "%/yr), " +
      "<select id=\"selectButton\"></select> will never reach <select id=\"catchupCountry\"></select>'s current GDP per capita. ")
  }
  else {
    d3.select("#projection").html("At its current growth rate (" + historicalGrowthPct + "%/yr), " +
      "it will take <select id=\"selectButton\"></select>  " +
      "<strong>" + Math.round(calculateYears(lastGDP, lastGDPCatchup, historicalGrowth)) + "</strong> " + 
      "years to reach <select id=\"catchupCountry\"></select>'s current GDP per capita. ")
  }
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
  function(data){
    filteredData = data.filter(function(row){ 
        return row.country == "France";
    });


    console.log(uniqueValues);
  });

d3.csv("http://oliverwkim.com/assets/mountain_to_climb/pwt_10.csv", 

  function(data) {
    console.log(data)

    var selectedCountry = "Kenya"


    // get country names
    countries = d3.map(data, function(d){return d.country;}).keys()

    growthOptions = ['current growth rate', 'Chinese growth miracle', 'Taiwanese growth miracle', 'Soviet growth miracle'];

    updateProjection(2328.76, 63485.57, 0.03)

    // Make select button
    d3.select("#selectButton")
      .selectAll('myOptions')
      .data(countries)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; })
      .property("selected", function(d){ return d === selectedCountry}); // corresponding value returned by the button

    d3.select("#catchupCountry")
      .selectAll('myOptions')
      .data(countries)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; })
      .property("selected", function(d){ return d === "United States"}); // corresponding value returned by the button

    updateButtons()

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
      .domain(countries)
      .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
      .domain([1950,2020])
      .range([ 0, width ]);

    svg.style("font", "30px 'Lato', sans-serif");

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))).attr("class", "axis");

    // Add Y axis
    var y = d3.scaleLog()
      .domain( [100,100000])
      .range([ height, 0 ]);

    var s = d3.scaleLog().domain([100, 100000]).range([1000, 0])

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function (d) {
        return y.tickFormat(4, d3.format(",d"))(d) })).attr("class", "axis");

    dataFilter = data.filter(function(row){ 
        return row.country == selectedCountry;
    });

    // Initialize line with Kenya
    var line = svg
      .append('g')
      .append("path")
        .datum(dataFilter)
        .attr("d", d3.line()
          .x(function(d) { return x(+d.year) })
          .y(function(d) { return y(+d.rgdpe_pc) })
        )
        .attr("stroke", function(d){ return myColor(selectedCountry) })
        .style("stroke-width", 4)
        .style("fill", "none");

      console.log(dataFilter)

      // grab most recent GDP value
      var firstGDP  = dataFilter[0].rgdpe_pc
      var lastGDP   = dataFilter[dataFilter.length - 1].rgdpe_pc

      var firstGDPyear = dataFilter[0].year
      var lastGDPyear   = dataFilter[dataFilter.length - 1].year

      var historicalGrowth   = calculateRate(firstGDP, lastGDP, lastGDPyear - firstGDPyear)
      console.log(historicalGrowth)


    // A function that updates the chart
    function update(selectedCountry, catchupCountry) {

      // Create new data with the selection?
      dataFilter = data.filter(function(row){ 
          return row.country == selectedCountry;
      });

      // grab most recent GDP value
      var firstGDP  = dataFilter[0].rgdpe_pc
      var lastGDP   = dataFilter[dataFilter.length - 1].rgdpe_pc

      var firstGDPyear = dataFilter[0].year
      var lastGDPyear   = dataFilter[dataFilter.length - 1].year

      var historicalGrowth   = calculateRate(firstGDP, lastGDP, lastGDPyear - firstGDPyear)
      console.log(historicalGrowth)

      // grab catchup country
      dataFilterCatchup = data.filter(function(row){ 
          return row.country == catchupCountry;
      });
      var lastGDPCatchup = dataFilterCatchup[dataFilterCatchup.length - 1].rgdpe_pc

      // Give these new data to update line
      line
          .datum(dataFilter)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .defined(function(d) { return d.rgdpe_pc != 0; })
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y(d.rgdpe_pc) })
          )
          .attr("stroke", function(d){ return myColor(selectedCountry) })

      // update text   
      updateProjection(lastGDP, lastGDPCatchup, historicalGrowth)

      d3.select("#catchupCountry")
        .selectAll('myOptions')
        .data(countries)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })
        .property("selected", function(d){
          return d === catchupCountry;
        }); 

      d3.select("#selectButton")
        .selectAll('myOptions')
        .data(countries)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })
        .property("selected", function(d){
               return d === selectedCountry;
          }); 


        updateButtons();


    }

    function updateButtons (){

        // When the button is changed, run the updateChart function
        d3.selectAll("#selectButton, #catchupCountry").on("change", function(d) {

            // recover the options that have been chosen
            var selectedOption = d3.select("#selectButton").property("value")
            var catchupCountry = d3.select("#catchupCountry").property("value")

            // run the updateChart function with this selected option
            update(selectedOption, catchupCountry)
        });

    }



})