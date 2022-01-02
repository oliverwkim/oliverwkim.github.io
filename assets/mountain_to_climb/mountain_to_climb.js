// https://www.d3-graph-gallery.com/graph/line_basic.html
// https://www.d3-graph-gallery.com/graph/line_select.html


function calculateRate (start, end, years){
  return Math.pow(end / start, 1 / years) - 1
}

function calculateYears (start, end, rate){
  return Math.log(end / start) / Math.log(1 + rate)
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

  // When reading the csv, I must format variables:
  /*function(d){

    console.log(d)
    return { 
      date : +d.year,
    	value : parseFloat(d.France)
    }
  },*/

  // Now I can use this dataset:
  function(data) {

    data.date = +data.year
    console.log(data.columns)

    // get country names, remove first element
    allGroup = data.columns
    allGroup.shift();

    // Make select button
    d3.select("#selectButton")
      .selectAll('myOptions')
      .data(allGroup)
      .enter()
      .append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; }); // corresponding value returned by the button


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
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain( [0,60000])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Initialize line with group a
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

    d3.select("#projection").text("Afghanistan")


    // A function that updates the chart
    function update(selectedGroup) {

      // Create new data with the selection?
      var dataFilter = data.map(function(d){return {year: d.year, value:parseFloat(d[selectedGroup])} })

      // grab most recent GDP value
      var lastGDP = dataFilter[dataFilter.length - 1].value

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
      d3.select("#projection").html("At 7% growth, it will take <strong>" + selectedGroup + "</strong> " + 
          Math.round(calculateYears(lastGDP, 63485.57, 0.07)) + " years to catch up to the US.")

    }

    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(d) {

        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")

        // run the updateChart function with this selected option
        update(selectedOption)
    });

}
)


/*
var parseDate = d3.timeParse("%Y").parse;

d3.csv("/assets/mountain_to_climb/weo_2021_10_long.csv", function(d){
		return { 
			date : d3.timeParse("%Y")(d.year), 
			France : +d.France 
		}
	},
	function(data) {

	// When reading the csv, I must format variables:
	


})
*/