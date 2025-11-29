---
layout: post
title: The Mountain To Climb
published: true
custom_css: mountain_to_climb
excerpt: At current growth rates, how long will it take for developing countries to catch up to the rich world?

---

<div id="toolbar">
<div id="interface">
	At <select id = "growthRates" ></select>, when <br />
 	will <select id="selectCountry"></select> 
	reach 2023 GDP per capita in
	<select id="catchupCountry"></select>?
</div>
<div id="projection"></div>
</div>
<div style="clear: both; margin-bottom: 2em;"></div>
<div id="forecasts"></div>
<button id="downloadBtn" style="margin-top: 10px; cursor: pointer;">
    ⬇ Save Chart as Image
</button>

With this tool, you can calculate how long it will take for developing countries to reach higher income levels--the mountain to climb, so to speak--under a range of growth scenarios, ranging from the pessimistic to the optimistic.

The figures lay bare the harsh logic of compounding economic growth, and the staggering levels of inequality between countries. (Data is current as of 2023.) Some stark examples:

* At its average historical growth rate, it will take over **300 years** for <button value="Guinea-Bissau" id="example">🇬🇼 Guinea-Bissau</button> to reach the 2019 GDP per capita of its former colonizer Portugal.

* At its average historical growth rate, it will take **2,572 years** for GDP per capita in <button value="Senegal" id="example">🇸🇳 Senegal</button> to reach its colonizer France's 2019 level. 

* Even at a spectacular Chinese rate of growth (7%/year), the <button value="the D.R. Congo" id="example">🇨🇩 Democratic Republic of the Congo</button> will take **64 years** to reach current income levels in the United States.

* At its present rate, <button value="China" id="example">🇨🇳 China</button> will achieve current US income levels in **35 years**--sooner than <button value="Japan" id="example">🇯🇵 Japan</button>, which will take **80 years**.

Note that these are **not** predictions--they are simply projections of future economic growth based on the historical trend of your choice.

Economic growth is not everything. The economic needs of human beings need to be balanced against the preservation of the environment and the quality of non-human lives. The distribution of economic output also matters: if a small elite hoards all the economic gains, then for the average person headline GDP growth is largely irrelevant. But we know that, on average, the [availability and quality of things](https://ourworldindata.org/what-is-economic-growth) that make safer and healthier lives possible--health care, education, housing, entertainment, freedom from violence--grow with incomes per capita. The largest reduction in poverty we know of, the Chinese economic miracle, came as the result of rapid economic growth. 

Note also that this tool does not calculate "convergence" or "catch-up", strictly speaking. The United States and other developed countries will likely continue to grow; convergence is trying to chase down a moving target. By contrast, in this exercise, the reader chooses a _static_ income target they want to hit, which hopefully corresponds to a comfortable and dignified quality of life. If you're interested in convergence, check out this [alternative version of this tool](/mountain_to_climb_convergence/).

In some sense, then, this exercise is agnostic. It shows us, based on historical experience, how long it would take to bring the incomes of current developing countries to any level that we choose. It does not say which policies to enact, which projected growth rate is achievable, or even which target level of income is desirable. It is then up to us--or, more correctly, the people living in these developing countries--to decide what paths align most with their values.


_Real GDP per capita is expenditure-side real GDP at chained PPPs (2021 US$), divided by population, using underlying data from the Penn World Tables, version 11.0: Feenstra, Robert C., Robert Inklaar and Marcel P. Timmer (2015), "The Next Generation of the Penn World Table" American Economic Review, 105(10), 3150-3182, available for download at [www.ggdc.net/pwt](www.ggdc.net/pwt)_.

_Version 0.9. [Comments and suggestions](https://twitter.com/oliverwkim) welcome._

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.

<script src="https://d3js.org/d3.v4.js"></script>
<script src="https://d3js.org/d3-scale-chromatic.v1.min.js"></script>
<script src="/assets/mountain_to_climb/mountain_to_climb.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/save-svg-as-png/1.4.17/saveSvgAsPng.min.js"></script>

