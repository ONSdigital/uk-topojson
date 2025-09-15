<script>
	import { onMount } from "svelte";
	import { feature, topology } from "topojson";
	import { Map, MapSource, MapLayer, MapTooltip } from "@onsvisual/svelte-maps";
  import { csvFormat } from "d3-dsv";
	import bbox from "@turf/bbox";
  import { coordEach } from "@turf/meta";
  import { stringify } from "wkt";
	import { geoTypes, countries, path, style } from "./config";
  import years from "./years";
	
	let map = null;
	let bounds;
	let hovered;
	let lookup;
  let geojson = {};
	let geoType = geoTypes[0];
	let year = years[years.length - 1];
  let ctrys = [...countries];
	
	function filterGeo(geo, year, ctrys) {
		let filtered = JSON.parse(JSON.stringify(geo));
    let codes = ["K", ...ctrys.map(c => c.key)];
		filtered.features = filtered.features.filter(f => {
			return codes.includes(f.properties.areacd[0]) &&
        !(f.properties.end && f.properties.end < year) &&
				!(f.properties.start && f.properties.start > year);
		}).map(f => {
			f.properties = f.properties = {areacd: f.properties.areacd, areanm: f.properties.areanm};
			return f;
		});
		return filtered;
	}
  $: filteredGeo = bounds ? filterGeo(geojson[geoType.key], year, ctrys) : null;
	
	function download(mode = "topo") {
		const key = geoType.key;
    const geo = {};
		geo[key] = filteredGeo;

    let output, filename;

    if (mode !== "topo") {
      output = geo[key];
      coordEach(output, c => {
        c[0] = Math.round(c[0] * 1e4) / 1e4;
        c[1] = Math.round(c[1] * 1e4) / 1e4;
      });
      if (mode === "csv") {
        output = csvFormat(
          output.features
            .map(f => ({...f.properties, geometry: stringify(f.geometry)}))
            .sort((a, b) => a.areacd.localeCompare(b.areacd))
        );
        filename = `${key}${year}.csv`;
      } else {
        filename = `${key}${year}.geojson`;
      }
    } else {
      output = topology(geo, 1e5);
      filename = `${key}${year}.json`;
    }

    const blob = mode === "csv" ? new Blob([output], {type: "text/csv"}) :
      new Blob([JSON.stringify(output)], {type: "application/json"});
    const url = window.URL || window.webkitURL || window;
    const link = url.createObjectURL(blob);
    const a = document.createElement("a");

    a.download = filename;
    a.href = link;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
	
	async function init() {
    const topojson = await (await fetch(path)).json();

		let lkp = {};
		geoTypes.forEach(type => {
			geojson[type.key] = feature(topojson, topojson.objects[type.key]);
			geojson[type.key].features.forEach(f => lkp[f.properties.areacd] = f.properties);
		});
		bounds = bbox(geojson["uk"]);
		lookup = lkp;
	};
	onMount(init);
</script>

<main>
  <h1>UK Administrative Geographies, {years[0]}&ndash;{years[years.length - 1]}</h1>

  <p style:max-width="780px">This tool provides geographic boundaries for the main UK administrative geographies. You can view and download a geography type for a specific year by selecting from the dropdowns below, or you can download all of the geographies in a <a href="./data/topo.json" download="topo.json">single TopoJSON file (600 KB)</a>.</p>

  <nav>
    <div>
      <label>
        Geography type<br/>
        <select bind:value={geoType}>
          {#each geoTypes as type}
          <option value={type}>{type.label}</option>
          {/each}
        </select>
      </label>
  
      <label>
        Year<br/>
        <select bind:value={year}>
          {#each years as y}
          <option value={y}>{y}</option>
          {/each}
        </select>
      </label>
  
      <div class="countries">
        Countries<br/>
        {#each countries as c}
        <label>
          <input type="checkbox" name="countries" value={c} bind:group={ctrys}/>
          {c.label}
        </label>
        {/each}
      </div>
    </div>
    <div>
      <button on:click={() => download("geo")}>
        Download GeoJSON
      </button>
      <button on:click={() => download("topo")}>
        Download TopoJSON
      </button>
      <button on:click={() => download("csv")}>
        Download CSV/WKT
      </button>
    </div>
  </nav>

  {#if filteredGeo}
  <div class="map-container">
    <Map bind:map {style} controls location={{bounds}}>
      <MapSource id="geo" type="geojson" data={filteredGeo} promoteId="areacd">
        <MapLayer
          id="geo-fill"
          type="fill"
          paint="{{
            "fill-color": "white",
            "fill-opacity": ['case',
              ['==', ['feature-state', 'hovered'], true], 0.3,
              0
            ]
          }}"
          hover bind:hovered>
          <MapTooltip content="{hovered ? `<b>${lookup[hovered].areanm}</b><br/>${hovered}` : ''}"/>
        </MapLayer>
        <MapLayer
          id="geo-line"
          type="line"
          paint="{{
            "line-color": "white",
            "line-width": ['case',
              ['==', ['feature-state', 'hovered'], true], 2.5,
              0.7
            ]
          }}"/>
      </MapSource>
    </Map>
  </div>
  {/if}

  <p style:max-width="780px"><small>This tool was coded by <a href="https://ahmadbarclay.com/">Ahmad Barclay</a> based on geography files available from the <a href="https://geoportal.statistics.gov.uk/">ONS Open Geography Portal</a>. You can find the code used to generate the TopoJSON file in <a href="https://github.com/onsdigital/uk-topojson">this Github repo</a>.</small></p>
</main>

<style>
  main {
    max-width: 980px;
    margin: 0 auto;
    padding-bottom: 10px;
  }
  h1 {
    margin-top: 10px;
  }
  nav > div {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  button, select {
    height: 40px;
    margin: 0 10px 10px 0;
  }
  input {
    margin-bottom: 16px;
  }
  .map-container {
    height: 500px;
  }
  .countries > label {
    display: inline-block;
    margin-right: 12px;
  }
</style>