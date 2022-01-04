---
layout: post
title: The Mountain To Climb
published: true
custom_css: mountain_to_climb
excerpt: At current growth rates, how long will it take for developing countries to catch up to the rich world?

---

<div id="toolbar">
<div id="interface">
	At <select id = "growthRates" ></select>, 
	how long will it take for <select id="selectCountry"></select> 
	to reach current GDP per capita in
	<select id="catchupCountry"></select>?
</div>
<div id="projection"></div>
</div>
<div style="clear: both; margin-bottom: 2em;"></div>
<div id="forecasts"></div>

As we enter a new year, it's worth thinking about the problem of economic growth, particularly for the hundreds of millions who still live in [extreme poverty](https://ourworldindata.org/extreme-poverty). With this tool, you can calculate how long it will take for developing countries to reach higher income levels--the mountain to climb, so to speak--under a range of growth scenarios, ranging from the pessimistic to the optimistic.

The figures lay bare the harsh logic of compounding economic growth, and the staggering levels of inequality between nations. Some stark examples:

* Even at a spectacular Chinese rate of growth (5%/year), the <button value="D.R. Congo" id="example">Democratic Republic of the Congo</button> will take 61 years to reach current income levels in the United States.

* At its average historical growth rate, it will take over 300 years for <button value="Guinea-Bissau" id="example">Guinea-Bissau</button> to reach the 2019 GDP per capita of its former colonizer Portugal.

* If it continues growing at its present rate, <button value="China" id="example">China</button> will achieve current US income levels sooner than <button value="Japan" id="example">Japan</button> (35 years vs 80).

This data is current as of 2019; it does not include the devastation of the Covid-19 pandemic, which has likely erased most of the economic gains of the past decade, and pushed [hundreds of millions of people into extreme poverty](https://www.theguardian.com/global-development/2021/feb/03/decades-of-progress-on-extreme-poverty-now-in-reverse-due-to-covid).

Economic growth is not everything. The economic needs of human beings need to be balanced against the preservation of the environment and the quality of non-human lives. The distribution of economic output also matters: if a small elite hoards all the economic gains, then for the average person headline GDP growth is largely irrelevant. But we know that, on average, the [availability and quality of things](https://ourworldindata.org/what-is-economic-growth) that make safer and healthier lives possible--health care, education, housing, entertainment, freedom from violence--grow with incomes per capita. The largest reduction in poverty we know of, the Chinese economic miracle, came with rapid economic growth. 

In some sense, then, this exercise is agnostic. It shows us, based on historical experience, how long it would take to bring the incomes of current developing countries to the level of those enjoyed in the rich world. It does not say which policies to enact, or even if these projected paths of growth are desirable. It is then up to us--or, more correctly, the people living in these developing countries--to decide what paths align most with their values.

Unacceptable.

_Source: Penn World Tables v10. Version 0.5._

<script src="http://d3js.org/d3.v4.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script src="/assets/mountain_to_climb/mountain_to_climb.js"></script>


