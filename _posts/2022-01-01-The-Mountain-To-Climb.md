---
layout: post
title: The Mountain To Climb
published: true
---

At current trends, how long would it take for Kenya to reach South Korean levels of GDP?

<!-- Initialize a select button -->
<select id="selectButton"></select>

<!-- Create a div where the graph will take place -->
<div id="forecasts"></div>

Economic growth is not everything. The economic needs of human beings need to be balanced against the preservation of the environment and the quality of non-human lives. The distribution of economic output also matters: if a small elite hoards all the economic gains, then for the average person headline GDP growth hardly matters. But we know that, on average, the availability and quality of things that make safer and healthier lives possible--health care, education, housing, entertainment, freedom from violence--grow with incomes per capita. The largest reduction in poverty we know of, the Chinese economic miracle, was made possible by rapid economic growth. 

In some sense, then, this exercise is agnostic. It shows us, based on historical experience, how long it would take to bring the incomes of current developing countries to the level of those enjoyed in the rich world. It does not say which policies to enact, or even if these projected paths of growth are desirable. It is then up to us--or, more correctly, the people living in these developing countries--to decide what paths align most with their values.

<script src="http://d3js.org/d3.v4.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>

<script>
var margin = {top: 10, right: 100, bottom: 30, left: 30},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#forecasts")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
    
var allGroup = ["France", "Kenya"];

d3.select("#selectButton")
  .selectAll('myOptions')
 	.data(allGroup)
  .enter()
	.append('option')
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; }); // corresponding value returned by the button


</script>