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

    d3.select("#projection").html("At its current growth rate (" + historicalGrowthPct + "%/yr), " +
      "it will take <select id=\"selectButton\"></select>  " +
      "<strong>" + Math.round(calculateYears(lastGDP, lastGDPCatchup, 0.07)) + "</strong> " + 
      "years to reach <select id=\"catchupCountry\"></select>'s current GDP per capita. ")
}


var margin = {top: 10, right: 100, bottom: 30, left: 100},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#forecasts")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


d3.csv("http://oliverwkim.com/assets/mountain_to_climb/weo_2021_10_long.csv", 

  function(data) {

    data.date = +data.year
    console.log(data.columns)

    // get country names, remove first element
    allGroup = data.columns
    allGroup.shift();

    updateProjection(2328.76, 63485.57, 0.03)

    // Make select button
    d3.select("#selectButton")
      .selectAll('myOptions')
      .data(allGroup)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; }); // corresponding value returned by the button

    d3.select("#catchupCountry")
      .selectAll('myOptions')
      .data(allGroup)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; })
      .property("selected", function(d){ return d === "United States"}); // corresponding value returned by the button

    updateButtons()

    // A color scale: one color for each group
    var myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
      .domain([1980,2020])
      .range([ 0, width ]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis
    var y = d3.scaleLog()
      .domain( [100,100000])
      .range([ height, 0 ]);

    var s = d3.scaleLog().domain([100, 100000]).range([1000, 0])

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(function (d) {
        return y.tickFormat(4, d3.format(",d"))(d) }) );

    // Initialize line with Afghanistan
    var line = svg
      .append('g')
      .append("path")
        .datum(data)
        .attr("d", d3.line()
          .defined(function(d) { return d.Afghanistan != 0; })
          .x(function(d) { return x(+d.year) })
          .y(function(d) { return y(+d.Afghanistan) })
        )
        .attr("stroke", function(d){ return myColor("Afghanistan") })
        .style("stroke-width", 4)
        .style("fill", "none");

      var selectedGroup = "Afghanistan"

      var dataFilter = data.map(function(d){return {year: d.year, value:parseFloat(d[selectedGroup])} })

      // grab most recent GDP value
      var firstGDP  = dataFilter[0].value
      var lastGDP   = dataFilter[dataFilter.length - 1].value

      var firstGDPyear = dataFilter[0].year
      var lastGDPyear   = dataFilter[dataFilter.length - 1].year

      var historicalGrowth   = calculateRate(firstGDP, lastGDP, lastGDPyear - firstGDPyear)
      console.log(historicalGrowth)


    // A function that updates the chart
    function update(selectedGroup, catchupCountry) {

      // Create new data with the selection?
      var dataFilter = data.map(function(d){return {year: d.year, value:parseFloat(d[selectedGroup])} })

      // grab most recent GDP value
      var firstGDP  = dataFilter[0].value
      var lastGDP   = dataFilter[dataFilter.length - 1].value

      var firstGDPyear = dataFilter[0].year
      var lastGDPyear   = dataFilter[dataFilter.length - 1].year

      var historicalGrowth   = calculateRate(firstGDP, lastGDP, lastGDPyear - firstGDPyear)
      console.log(historicalGrowth)

      // grab catchup country
      var dataFilterCatchup = data.map(function(d){return {year: d.year, value:parseFloat(d[catchupCountry])} })
      var lastGDPCatchup = dataFilterCatchup[dataFilterCatchup.length - 1].value

      // Give these new data to update line
      line
          .datum(dataFilter)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .defined(function(d) { return d.value != 0; })
            .x(function(d) { return x(d.year) })
            .y(function(d) { return y(d.value) })
          )
          .attr("stroke", function(d){ return myColor(selectedGroup) })

      // update text   
      updateProjection(lastGDP, lastGDPCatchup, historicalGrowth)

      d3.select("#catchupCountry")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })
        .property("selected", function(d){
          return d === catchupCountry;
        }); 

      d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })
        .property("selected", function(d){
               return d === selectedGroup;
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