/* The Growth Miracle Atlas — application */
/* globals d3, topojson, ATLAS, WORLD */
(function () {
"use strict";

const EPS = ATLAS.episodes;
const SERIES = ATLAS.series;

/* ---------------- display names & labels ---------------- */

const DISPLAY_NAME = {
  "Republic of Korea": "South Korea", "Lao People's DR": "Laos",
  "U.R. of Tanzania: Mainland": "Tanzania", "China, Hong Kong SAR": "Hong Kong",
  "Viet Nam": "Vietnam", "Russian Federation": "Russia",
  "Syrian Arab Republic": "Syria", "State of Palestine": "Palestine",
  "Congo": "Congo (Rep.)", "Côte d'Ivoire": "Côte d'Ivoire",
};
const dn = (e) => DISPLAY_NAME[e.country] || e.country;

const SECTOR_SHORT = {
  "Agriculture": "Agriculture", "Mining": "Mining", "Manufacturing": "Manufacturing",
  "Utilities & construction": "Utilities & constr.",
  "Trade & hospitality": "Trade & hospitality",
  "Transport & communications": "Transport & comms",
  "Finance, real estate & business": "Finance & business",
  "Government & other services": "Gov’t & other services",
};

const DATA_CAVEAT = new Set(["MMR-1991", "MMR-1976", "TKM-2004", "GNQ-1969", "GNQ-1988",
  "ZWE-2006", "SOM-2010", "CHN-1967"]);

/* ---------------- formats ---------------- */

const fmtMoney = (v) => "$" + d3.format(",")(Math.round(v));
const fmtMoneyTick = (v) => v >= 1000 ? "$" + (v / 1000) + "k" : "$" + v;
const fmtX = (v) => "×" + (v >= 10 ? v.toFixed(1) : v.toFixed(2).replace(/0$/, ""));
const fmtPP = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2) + " pp";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------------- ranks ---------------- */

const bySize = [...EPS].sort((a, b) => b.expansion - a.expansion);
bySize.forEach((e, i) => (e._rankSize = i + 1));
const byDur = [...EPS].sort((a, b) => (b.duration - a.duration) || (b.expansion - a.expansion));
byDur.forEach((e, i) => (e._rankDur = i + 1));
const epById = new Map(EPS.map((e) => [e.id, e]));

/* ---------------- state ---------------- */

// one entry per sortable column; dir is the direction a fresh click applies
const SORT_DEFS = {
  start: { get: (e) => e.start, dir: 1 },
  duration: { get: (e) => e.duration, dir: -1 },
  g: { get: (e) => e.g, dir: -1 },
  expansion: { get: (e) => e.expansion, dir: -1 },
};

const state = {
  sort: "expansion", dir: SORT_DEFS.expansion.dir,
  region: "All", sector: "All", q: "", sel: null,
};

function comparator() {
  const def = SORT_DEFS[state.sort];
  return (a, b) => {
    const d = (def.get(a) - def.get(b)) * state.dir;
    if (d) return d;
    return (b.expansion - a.expansion) || a.country.localeCompare(b.country);
  };
}

/* ---------------- tooltip ---------------- */

const tt = document.getElementById("tooltip");
function ttShow(html, ev) {
  tt.innerHTML = html;
  tt.style.display = "block";
  ttMove(ev);
}
function ttMove(ev) {
  const pad = 14, w = tt.offsetWidth, h = tt.offsetHeight;
  let x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + w > window.innerWidth - 8) x = ev.clientX - w - pad;
  if (y + h > window.innerHeight - 8) y = ev.clientY - h - pad;
  tt.style.left = x + "px";
  tt.style.top = y + "px";
}
function ttHide() { tt.style.display = "none"; }

/* ---------------- episode table ---------------- */

const tbody = document.getElementById("tbody");
document.querySelector(".list-pane").insertAdjacentHTML("beforeend",
  '<p style="font-family:var(--sans);font-size:10.5px;color:var(--ink3);padding:8px 2px;">' +
  '<span class="dag">†</span> still under way when the data end in 2023.</p>');

function visibleEpisodes() {
  const q = state.q.trim().toLowerCase();
  return EPS.filter((e) =>
    (state.region === "All" || e.region === state.region) &&
    (state.sector === "All" || (e.decomp && e.decomp.driver === state.sector)) &&
    (!q || dn(e).toLowerCase().includes(q) || e.country.toLowerCase().includes(q) ||
      e.iso.toLowerCase().includes(q) || (e.title || "").toLowerCase().includes(q))
  ).sort(comparator());
}

function renderTable() {
  const rows = visibleEpisodes();
  tbody.innerHTML = rows.map((e, i) => {
    const yrs = e.start + "–" + e.end + (e.censored ? '<span class="dag">†</span>' : "");
    const drv = e.decomp ? SECTOR_SHORT[e.decomp.driver] : "—";
    return `<tr class="row${e.id === state.sel ? " sel" : ""}" data-id="${e.id}">
      <td class="c-rank">${i + 1}</td>
      <td class="c-name"><span class="cname">${esc(dn(e))}</span>
        <span class="years">&nbsp;${yrs}</span>
        <span class="ctitle">${esc(e.title)}</span></td>
      <td>${e.duration}</td>
      <td>${e.g.toFixed(1)}</td>
      <td>${fmtX(e.expansion)}</td>
      <td class="c-driver">${drv}</td>
    </tr>`;
  }).join("");
  const ctys = new Set(rows.map((e) => e.iso)).size;
  document.getElementById("count").textContent =
    rows.length + " episodes · " + ctys + " economies";
}

tbody.addEventListener("click", (ev) => {
  const tr = ev.target.closest("tr.row");
  if (tr) selectEpisode(tr.dataset.id, { scrollList: false });
});

/* ---------------- world map ---------------- */

const MAP_W = 560, MAP_H = 292;
const mapSvg = d3.select("#map").attr("viewBox", `0 0 ${MAP_W} ${MAP_H}`);
const MICRO = { SGP: [103.85, 1.29], HKG: [114.17, 22.30], MUS: [57.55, -20.30] };

const epsByIso = d3.group(EPS, (e) => e.iso);
const isoByNum = new Map();
EPS.forEach((e) => { if (e.num != null) isoByNum.set(+e.num, e.iso); });

const countries = topojson.feature(WORLD, WORLD.objects.countries).features
  .filter((f) => +f.id !== 10); // drop Antarctica
const projection = d3.geoNaturalEarth1();
projection.fitExtent([[2, 2], [MAP_W - 2, MAP_H - 2]], { type: "FeatureCollection", features: countries });
const geopath = d3.geoPath(projection);

function countryFill(iso) {
  if (!iso || !epsByIso.has(iso)) return "var(--mapnone)";
  const n = epsByIso.get(iso).length;
  return n >= 3 ? "var(--map3)" : n === 2 ? "var(--map2)" : "var(--map1)";
}

function mapTipHTML(iso, fallback) {
  const eps = epsByIso.get(iso);
  if (!eps) return `<span class="tt-h">${esc(fallback)}</span><br><span class="tt-m">no episode recorded</span>`;
  const list = [...eps].sort((a, b) => a.start - b.start)
    .map((e) => e.start + "–" + e.end).join(", ");
  return `<span class="tt-h">${esc(dn(eps[0]))}</span><br>` +
    `<span class="tt-m">${eps.length} episode${eps.length > 1 ? "s" : ""}: ${list} · click to open</span>`;
}

function selectCountryTopEpisode(iso) {
  const eps = epsByIso.get(iso);
  if (eps) selectEpisode([...eps].sort((a, b) => b.expansion - a.expansion)[0].id);
}

const gCountries = mapSvg.append("g");
gCountries.selectAll("path").data(countries).join("path")
  .attr("class", (f) => "country" + (isoByNum.has(+f.id) ? " has" : ""))
  .attr("d", geopath)
  .attr("fill", (f) => countryFill(isoByNum.get(+f.id)))
  .attr("stroke", "var(--paper)")
  .attr("stroke-width", 0.6)
  .on("mousemove", function (ev, f) {
    const iso = isoByNum.get(+f.id);
    ttShow(mapTipHTML(iso, (f.properties && f.properties.name) || "—"), ev);
  })
  .on("mouseleave", ttHide)
  .on("click", (ev, f) => {
    const iso = isoByNum.get(+f.id);
    if (iso) selectCountryTopEpisode(iso);
  });

const gMicro = mapSvg.append("g");
gMicro.selectAll("circle").data(Object.keys(MICRO).filter((k) => epsByIso.has(k))).join("circle")
  .attr("class", "country has micro")
  .attr("cx", (k) => projection(MICRO[k])[0])
  .attr("cy", (k) => projection(MICRO[k])[1])
  .attr("r", 4)
  .attr("fill", (k) => countryFill(k))
  .attr("stroke", "var(--paper)")
  .attr("stroke-width", 1.6)
  .on("mousemove", function (ev, k) { ttShow(mapTipHTML(k, k), ev); })
  .on("mouseleave", ttHide)
  .on("click", (ev, k) => selectCountryTopEpisode(k));

function updateMap() {
  const selIso = state.sel ? epById.get(state.sel).iso : null;
  gCountries.selectAll("path")
    .attr("fill", (f) => {
      const iso = isoByNum.get(+f.id);
      return iso && iso === selIso ? "var(--accent)" : countryFill(iso);
    })
    .attr("stroke", (f) => (isoByNum.get(+f.id) === selIso ? "var(--ink)" : "var(--paper)"))
    .attr("stroke-width", (f) => (isoByNum.get(+f.id) === selIso ? 0.9 : 0.6));
  gCountries.selectAll("path").filter((f) => isoByNum.get(+f.id) === selIso).raise();
  gMicro.selectAll("circle")
    .attr("fill", (k) => (k === selIso ? "var(--accent)" : countryFill(k)))
    .attr("r", (k) => (k === selIso ? 5.5 : 4))
    .attr("stroke", (k) => (k === selIso ? "var(--ink)" : "var(--paper)"));
}

/* ---------------- GDP chart ---------------- */

function renderGDPChart(container, e) {
  const s = SERIES[e.iso];
  if (!s) return;
  const W = 560, H = 268, m = { t: 16, r: 16, b: 24, l: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const years = s.years, vals = s.y;
  const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([0, iw]);
  const yext = d3.extent(vals);
  const y = d3.scaleLog().domain([yext[0] * 0.9, yext[1] * 1.18]).range([ih, 0]);

  const fig = d3.select(container);
  fig.append("div").attr("class", "fig-title").text("Income per person, " + years[0] + "–" + years[years.length - 1]);
  fig.append("div").attr("class", "fig-sub")
    .text("Real GDP per person (2021 US$, log scale). Shaded band: the episode. Dashed: pre-acceleration trend, extended.");
  const svg = fig.append("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);

  svg.append("defs").append("clipPath").attr("id", "clip-gdp")
    .append("rect").attr("width", iw).attr("height", ih);

  // gridlines + y ticks
  const cand = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const yticks = cand.filter((v) => v >= y.domain()[0] && v <= y.domain()[1]);
  g.selectAll(".gy").data(yticks).join("line")
    .attr("x1", 0).attr("x2", iw).attr("y1", (v) => y(v)).attr("y2", (v) => y(v))
    .attr("stroke", "var(--hair)").attr("stroke-width", 1);
  g.selectAll(".gyt").data(yticks).join("text")
    .attr("x", -8).attr("y", (v) => y(v)).attr("dy", "0.32em")
    .attr("text-anchor", "end").attr("font-size", 10).attr("fill", "var(--ink2)")
    .text(fmtMoneyTick);

  // x ticks each decade
  const xticks = d3.range(Math.ceil(years[0] / 10) * 10, years[years.length - 1] + 1, 10);
  g.selectAll(".gxt").data(xticks).join("text")
    .attr("x", (v) => x(v)).attr("y", ih + 16)
    .attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "var(--ink2)")
    .text((v) => v);
  g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", ih).attr("y2", ih)
    .attr("stroke", "var(--hair2)").attr("stroke-width", 1);

  // episode band
  g.append("rect")
    .attr("x", x(e.start)).attr("width", Math.max(1, x(e.end) - x(e.start)))
    .attr("y", 0).attr("height", ih)
    .attr("fill", "var(--accent)").attr("opacity", 0.08);

  const yearVal = new Map(years.map((yr, i) => [yr, vals[i]]));

  // pre-acceleration trend, extended from the start year
  const y0 = yearVal.get(e.start);
  const gpre = e.gpre / 100;
  const trend = years.filter((yr) => yr >= e.start)
    .map((yr) => [x(yr), y(y0 * Math.exp(gpre * (yr - e.start)))]);
  g.append("path")
    .attr("d", d3.line()(trend))
    .attr("clip-path", "url(#clip-gdp)")
    .attr("fill", "none").attr("stroke", "var(--ink2)")
    .attr("stroke-width", 1.4).attr("stroke-dasharray", "4 4");

  // series line
  const line = d3.line().x((d, i) => x(years[i])).y((d) => y(d));
  g.append("path").attr("d", line(vals))
    .attr("fill", "none").attr("stroke", "var(--blue)")
    .attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round");

  // start / end markers with paper ring + labels
  const marks = [
    { yr: e.start, v: yearVal.get(e.start), lab: fmtMoney(e.y0), side: "start" },
    { yr: e.end, v: yearVal.get(e.end), lab: fmtMoney(e.y1), side: "end" },
  ];
  g.selectAll(".mk").data(marks).join("circle")
    .attr("cx", (d) => x(d.yr)).attr("cy", (d) => y(d.v)).attr("r", 4)
    .attr("fill", "var(--blue)").attr("stroke", "var(--paper)").attr("stroke-width", 2);
  g.selectAll(".mkt").data(marks).join("text")
    .attr("x", (d) => x(d.yr)).attr("y", (d) => y(d.v))
    .attr("dx", (d) => (d.side === "start" ? -8 : x(d.yr) > iw - 64 ? -8 : 8))
    .attr("dy", (d) => (d.side === "start" ? 14 : -9))
    .attr("text-anchor", (d) => (d.side === "start" ? "end" : x(d.yr) > iw - 64 ? "end" : "start"))
    .attr("font-size", 11).attr("font-weight", 600).attr("fill", "var(--ink)")
    .text((d) => d.lab);

  // crosshair + tooltip
  const cross = g.append("line").attr("y1", 0).attr("y2", ih)
    .attr("stroke", "var(--hair2)").attr("stroke-width", 1).style("display", "none");
  const dot = g.append("circle").attr("r", 3.5).attr("fill", "var(--blue)")
    .attr("stroke", "var(--paper)").attr("stroke-width", 2).style("display", "none");
  svg.append("rect")
    .attr("x", m.l).attr("y", m.t).attr("width", iw).attr("height", ih)
    .attr("fill", "transparent")
    .on("mousemove", function (ev) {
      const [mx] = d3.pointer(ev, g.node());
      const yr = Math.max(years[0], Math.min(years[years.length - 1], Math.round(x.invert(mx))));
      const v = yearVal.get(yr);
      if (v == null) return;
      cross.attr("x1", x(yr)).attr("x2", x(yr)).style("display", null);
      dot.attr("cx", x(yr)).attr("cy", y(v)).style("display", null);
      const inEp = yr >= e.start && yr <= e.end;
      ttShow(`<span class="tt-h">${yr}</span> — ${fmtMoney(v)}` +
        (inEp ? `<br><span class="tt-m">year ${yr - e.start} of the episode</span>` : ""), ev);
    })
    .on("mouseleave", function () {
      cross.style("display", "none"); dot.style("display", "none"); ttHide();
    });

  fig.append("figcaption").text(
    "Had the pre-1900s trend held" === "x" ? "" :
    `Had the prior trend (${e.gpre.toFixed(1)}% a year) simply continued, income in ${e.end} would have been ` +
    `${fmtMoney(e.y0 * Math.exp((e.gpre / 100) * (e.end - e.start)))}; it was ${fmtMoney(e.y1)}.`);
}

/* ---------------- decomposition chart ---------------- */

function roundedBar(x0, x1, yc, h, r, roundRight, roundLeft) {
  const w = Math.max(0.5, x1 - x0), y = yc - h / 2;
  const rr = roundRight ? Math.min(r, w / 2) : 0, rl = roundLeft ? Math.min(r, w / 2) : 0;
  return `M${x0 + rl},${y}` +
    `H${x1 - rr}` + (rr ? `a${rr},${rr} 0 0 1 ${rr},${rr}` : "") +
    `V${y + h - rr}` + (rr ? `a${rr},${rr} 0 0 1 ${-rr},${rr}` : "") +
    `H${x0 + rl}` + (rl ? `a${rl},${rl} 0 0 1 ${-rl},${-rl}` : "") +
    `V${y + rl}` + (rl ? `a${rl},${rl} 0 0 1 ${rl},${-rl}` : "") + "Z";
}

function renderDecomp(container, e) {
  const d = e.decomp;
  const fig = d3.select(container);
  const rows = d.sectors;
  const W = 560, rowH = 30, labW = 152, m = { t: 6, r: 18, b: 24 };
  const H = rows.length * rowH + m.t + m.b;
  const iw = W - labW - m.r;

  fig.append("div").attr("class", "fig-title").text("What drove it — the McMillan–Rodrik decomposition");
  fig.append("div").attr("class", "fig-sub").html(
    `Labour productivity grew <b>${d.g_prod.toFixed(1)}% a year</b> over ${d.w0}–${d.w1}: ` +
    `${d.within_total.toFixed(1)} pp within sectors, ${d.struct_total.toFixed(1)} pp from reallocation.`);
  fig.append("div").attr("class", "leg").html(
    `<span><span class="sw" style="background:var(--blue)"></span>Within-sector gains</span>` +
    `<span><span class="sw" style="background:var(--accent)"></span>Reallocation of labour</span>` +
    `<span><svg width="11" height="11" style="vertical-align:-1.5px;margin-right:5px">` +
    `<path d="M5.5,1 L10,5.5 L5.5,10 L1,5.5 Z" fill="var(--ink)"/></svg>Net contribution</span>`);

  const svg = fig.append("svg").attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.append("g").attr("transform", `translate(${labW},${m.t})`);

  let lo = 0, hi = 0;
  rows.forEach((r) => {
    hi = Math.max(hi, Math.max(0, r.within) + Math.max(0, r.struct));
    lo = Math.min(lo, Math.min(0, r.within) + Math.min(0, r.struct));
  });
  const x = d3.scaleLinear().domain([lo, hi]).nice().range([0, iw]);

  // gridlines + axis
  const xt = x.ticks(5);
  g.selectAll(".gx").data(xt).join("line")
    .attr("x1", (v) => x(v)).attr("x2", (v) => x(v))
    .attr("y1", 0).attr("y2", rows.length * rowH)
    .attr("stroke", (v) => (v === 0 ? "var(--hair2)" : "var(--hair)")).attr("stroke-width", 1);
  g.selectAll(".gxt").data(xt).join("text")
    .attr("x", (v) => x(v)).attr("y", rows.length * rowH + 15)
    .attr("text-anchor", "middle").attr("font-size", 10).attr("fill", "var(--ink2)")
    .text((v) => (v > 0 ? "+" : "") + v);
  g.append("text").attr("x", iw).attr("y", rows.length * rowH + 15)
    .attr("text-anchor", "end").attr("font-size", 9).attr("fill", "var(--ink3)")
    .attr("dy", "-26").attr("dx", 16).text("");
  svg.append("text").attr("x", W - m.r).attr("y", H - 2)
    .attr("text-anchor", "end").attr("font-size", 9.5).attr("fill", "var(--ink3)")
    .text("contribution, percentage points of growth per year");

  const GAP = 2, BH = 16;
  rows.forEach((r, i) => {
    const yc = i * rowH + rowH / 2;
    const isDriver = r.sector === d.driver;

    // sector label (left column)
    const lab = svg.append("text")
      .attr("x", labW - 10).attr("y", m.t + yc).attr("dy", "0.32em")
      .attr("text-anchor", "end").attr("font-size", 11)
      .attr("fill", isDriver ? "var(--ink)" : "var(--ink2)")
      .attr("font-weight", isDriver ? 700 : 400)
      .text(SECTOR_SHORT[r.sector]);

    // stacked segments with sign-aware placement + 2px surface gaps
    const segs = [
      { k: "within", v: r.within, c: "var(--blue)", name: "Within-sector gains" },
      { k: "struct", v: r.struct, c: "var(--accent)", name: "Reallocation of labour" },
    ];
    let posC = 0, negC = 0, posN = 0, negN = 0;
    const pos = segs.filter((s) => s.v > 0), neg = segs.filter((s) => s.v < 0);
    segs.forEach((s) => {
      if (s.v === 0) return;
      let x0, x1, outer = false;
      if (s.v > 0) {
        x0 = x(posC) + (posN > 0 ? GAP : 0);
        x1 = x(posC + s.v);
        posC += s.v; posN += 1;
        outer = posN === pos.length;
        if (x1 <= x0) x1 = x0 + 0.75;
        g.append("path").attr("d", roundedBar(x0, x1, yc, BH, 3, outer, false))
          .attr("fill", s.c).datum({ s, r })
          .on("mousemove", segTip).on("mouseleave", ttHide);
      } else {
        x1 = x(negC) - (negN > 0 ? GAP : 0);
        x0 = x(negC + s.v);
        negC += s.v; negN += 1;
        outer = negN === neg.length;
        if (x0 >= x1) x0 = x1 - 0.75;
        g.append("path").attr("d", roundedBar(x0, x1, yc, BH, 3, false, outer))
          .attr("fill", s.c).datum({ s, r })
          .on("mousemove", segTip).on("mouseleave", ttHide);
      }
    });

    // net-total label on the driver row only (selective labeling)
    if (isDriver) {
      const net = r.within + r.struct;
      const endX = net >= 0 ? x(Math.max(0, posC)) : x(negC);
      const anchorRight = net >= 0;
      const lab = g.append("text")
        .attr("x", anchorRight ? endX + 7 : endX - 7).attr("y", yc).attr("dy", "0.32em")
        .attr("text-anchor", anchorRight ? "start" : "end")
        .attr("font-size", 10.5).attr("font-weight", 700).attr("fill", "var(--ink)")
        .text((net >= 0 ? "+" : "−") + Math.abs(net).toFixed(1) + " pp");
      // if the label would run off the canvas, tuck it inside the bar end
      // (paper halo keeps it legible over any fill)
      const len = lab.node().getComputedTextLength();
      if (anchorRight && endX + 7 + len > W - labW - 4) {
        lab.attr("x", endX - 6).attr("text-anchor", "end")
          .attr("stroke", "var(--paper)").attr("stroke-width", 3).attr("paint-order", "stroke");
      } else if (!anchorRight && endX - 7 - len < -(labW - 4)) {
        lab.attr("x", endX + 6).attr("text-anchor", "start")
          .attr("stroke", "var(--paper)").attr("stroke-width", 3).attr("paint-order", "stroke");
      }
    }

    // net-contribution diamond on every row (drawn over the segments)
    const netv = r.within + r.struct;
    const ndx = x(netv);
    g.append("path")
      .attr("d", `M${ndx},${yc - 4.5} L${ndx + 4.5},${yc} L${ndx},${yc + 4.5} L${ndx - 4.5},${yc} Z`)
      .attr("fill", "var(--ink)")
      .attr("stroke", "var(--paper)").attr("stroke-width", 2)
      .attr("paint-order", "stroke");
    g.append("circle")
      .attr("cx", ndx).attr("cy", yc).attr("r", 8).attr("fill", "transparent")
      .on("mousemove", (ev) => ttShow(
        `<span class="tt-h">${esc(r.sector)}</span><br>` +
        `Net contribution: <b>${fmtPP(netv)}</b> of productivity growth a year<br>` +
        `<span class="tt-m">within ${fmtPP(r.within)} · reallocation ${fmtPP(r.struct)}</span>`, ev))
      .on("mouseleave", ttHide);
  });

  function segTip(ev) {
    const { s, r } = d3.select(this).datum();
    ttShow(
      `<span class="tt-h">${esc(r.sector)}</span><br>` +
      `${s.name}: <b>${fmtPP(s.v)}</b> of productivity growth a year<br>` +
      `<span class="tt-m">employment share ${r.emp0.toFixed(1)}% → ${r.emp1.toFixed(1)}%</span>`, ev);
  }

  // caption + accessible table view
  const src = d.source === "10SD" ? "GGDC 10-Sector Database" : "GGDC/UNU-WIDER Economic Transformation Database";
  const covered = Math.round(100 * (d.w1 - d.w0) / (e.end - e.start));
  fig.append("figcaption").text(
    `${src}, ${d.w0}–${d.w1}` +
    (covered < 95 ? ` (sectoral data cover ${covered}% of the episode)` : "") +
    `. Bars: each sector’s contribution to aggregate labour-productivity growth; ` +
    `blue is the sector’s own productivity growth, red is labour moving in or out. ` +
    `The diamond marks each sector’s net contribution; the leading sector is the largest net.`);

  const tv = fig.append("details").attr("class", "tableview");
  tv.append("summary").text("Data table");
  tv.append("table").html(
    "<thead><tr><th>Sector</th><th>Within, pp/yr</th><th>Reallocation, pp/yr</th><th>Total</th><th>Emp. share</th></tr></thead><tbody>" +
    rows.map((r) =>
      `<tr><td>${esc(r.sector)}</td><td>${r.within.toFixed(2)}</td><td>${r.struct.toFixed(2)}</td>` +
      `<td><b>${(r.within + r.struct).toFixed(2)}</b></td>` +
      `<td>${r.emp0.toFixed(1)}% → ${r.emp1.toFixed(1)}%</td></tr>`).join("") +
    `<tr><td><b>Total</b></td><td><b>${d.within_total.toFixed(2)}</b></td>` +
    `<td><b>${d.struct_total.toFixed(2)}</b></td><td><b>${(d.within_total + d.struct_total).toFixed(2)}</b></td><td></td></tr>` +
    "</tbody>");
}

/* ---------------- dossier ---------------- */

function renderDossier(e) {
  const el = document.getElementById("dossier");
  const others = (epsByIso.get(e.iso) || []).filter((o) => o.id !== e.id)
    .sort((a, b) => a.start - b.start);

  const badges = [];
  if (e.censored) badges.push('<span class="badge">Still running at data end</span>');
  if (e.recovery) badges.push('<span class="badge">Begins as rebound from collapse</span>');
  if (e.reaccel && e.reaccel.length)
    badges.push(`<span class="badge">Re-accelerated ${e.reaccel.join(", ")}</span>`);
  if (DATA_CAVEAT.has(e.id)) badges.push('<span class="badge warn">Data caveats — see text</span>');

  el.innerHTML = `
    <div class="kicker">No. ${e._rankSize} of ${EPS.length} by size · No. ${e._rankDur} by duration · ${esc(e.region)}</div>
    <h2>${esc(dn(e))} <span class="years">${e.start}–${e.end}</span></h2>
    <div class="epithet">${esc(e.title)}</div>
    <div class="statrow">
      <div class="stat"><span class="lbl">Growth</span><span class="val">${e.g.toFixed(1)}%</span>
        <span class="sub">a year; was ${e.gpre.toFixed(1)}% before</span></div>
      <div class="stat"><span class="lbl">Duration</span><span class="val">${e.duration} yrs</span>
        <span class="sub">${e.start}–${e.end}${e.censored ? "+" : ""}</span></div>
      <div class="stat"><span class="lbl">Income gain</span><span class="val">${fmtX(e.expansion)}</span>
        <span class="sub">${fmtMoney(e.y0)} → ${fmtMoney(e.y1)}</span></div>
      <div class="stat"><span class="lbl">Population</span><span class="val">${e.pop0 >= 100 ? Math.round(e.pop0) : e.pop0.toFixed(1)}m</span>
        <span class="sub">at the start</span></div>
    </div>
    ${badges.length ? `<div class="badges">${badges.join("")}</div>` : ""}
    <p class="blurb">${esc(e.blurb)}</p>
    <figure class="chart" id="fig-gdp"></figure>
    ${e.decomp ? '<figure class="chart" id="fig-dec"></figure>' :
      `<div class="nodata-note">No sectoral decomposition: neither the GGDC 10-Sector Database nor the
       Economic Transformation Database covers ${esc(dn(e))} for enough of ${e.start}–${e.end}.</div>`}
    ${others.length ? `<div class="chips"><span class="chips-lbl">Also from ${esc(dn(e))}</span>` +
      others.map((o) => `<button class="chip" data-id="${o.id}">${o.start}–${o.end}</button>`).join("") + "</div>" : ""}
    <div class="foot">Series: Penn World Table 11.0 (rgdpna/pop). Acceleration dated by spline F-statistic;
      growth rates are least-squares. ${e.decomp ? "" : "Sectoral databases cover " + EPS.filter(x => x.decomp).length + " of the " + EPS.length + " episodes."}</div>`;

  renderGDPChart(document.getElementById("fig-gdp"), e);
  if (e.decomp) renderDecomp(document.getElementById("fig-dec"), e);

  el.querySelectorAll(".chip").forEach((c) =>
    c.addEventListener("click", () => selectEpisode(c.dataset.id)));
}

/* ---------------- selection ---------------- */

function selectEpisode(id, opts = {}) {
  if (!epById.has(id)) return;
  state.sel = id;
  const e = epById.get(id);
  try { history.replaceState(null, "", "#" + id); } catch (err) { /* file:// quirks */ }
  tbody.querySelectorAll("tr.row").forEach((tr) =>
    tr.classList.toggle("sel", tr.dataset.id === id));
  const selRow = tbody.querySelector(`tr.row[data-id="${id}"]`);
  if (selRow && opts.scrollList !== false)
    selRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
  updateMap();
  renderDossier(e);
  const pane = document.querySelector(".detail-pane");
  if (opts.scrollPane !== false) pane.scrollTop = 0;
}

/* ---------------- controls ---------------- */

// column headers are the sort control: click to sort, click again to reverse
const sortHeaders = [...document.querySelectorAll("th.sortable")];
function syncSortHeaders() {
  sortHeaders.forEach((th) => {
    const on = th.dataset.sort === state.sort;
    th.classList.toggle("on", on);
    th.classList.toggle("asc", on && state.dir === 1);
    th.setAttribute("aria-sort",
      on ? (state.dir === 1 ? "ascending" : "descending") : "none");
  });
}
sortHeaders.forEach((th) => {
  const apply = () => {
    const key = th.dataset.sort;
    if (state.sort === key) state.dir = -state.dir;
    else { state.sort = key; state.dir = SORT_DEFS[key].dir; }
    syncSortHeaders();
    renderTable();
  };
  th.addEventListener("click", apply);
  th.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); apply(); }
  });
});
syncSortHeaders();
document.getElementById("regionsel").addEventListener("change", (ev) => {
  state.region = ev.target.value;
  renderTable();
});
const sectorSel = document.getElementById("sectorsel");
const sectorTally = new Map();
EPS.forEach((e) => {
  if (!e.decomp) return;
  sectorTally.set(e.decomp.driver, (sectorTally.get(e.decomp.driver) || 0) + 1);
});
// most common first — the point of the list is the distribution
const sectorsByCount = [...sectorTally.entries()]
  .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
const nDecomp = sectorsByCount.reduce((a, [, n]) => a + n, 0);
sectorsByCount.forEach(([s, n]) => {
  const opt = document.createElement("option");
  opt.value = s;
  opt.textContent = `${SECTOR_SHORT[s] || s} (${n})`;
  sectorSel.appendChild(opt);
});
sectorSel.addEventListener("change", (ev) => {
  state.sector = ev.target.value;
  renderTable();
});

// tally of leading sectors in the methodology section
const tallyBody = document.querySelector("#sector-tally tbody");
if (tallyBody) {
  tallyBody.innerHTML = sectorsByCount.map(([s, n]) => {
    const ec = new Set(EPS.filter((e) => e.decomp && e.decomp.driver === s)
      .map((e) => e.iso)).size;
    return `<tr><td>${esc(s)}</td><td>${n}</td><td>${ec}</td></tr>`;
  }).join("") +
    `<tr><td><b>All decomposed</b></td><td><b>${nDecomp}</b></td><td></td></tr>` +
    `<tr><td>No sectoral data</td><td>${EPS.length - nDecomp}</td><td></td></tr>`;
}
document.getElementById("q").addEventListener("input", (ev) => {
  state.q = ev.target.value;
  renderTable();
});

/* ---------------- boot ---------------- */

document.getElementById("ed-eps").textContent = EPS.length;
document.getElementById("ed-ctys").textContent = new Set(EPS.map((e) => e.iso)).size;
renderTable();
const initial = (location.hash || "").slice(1);
selectEpisode(epById.has(initial) ? initial : "KOR-1964", { scrollList: false, scrollPane: false });

})();
