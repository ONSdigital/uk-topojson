# UK TopoJSON, 2014 - 2025

This repo contains scripts and input files to generate a TopoJSON file covering the following geography layers from 2014 up to the present. You can download the [whole TopoJSON file here](https://raw.githubusercontent.com/ONSvisual/uk-topojson/refs/heads/main/output/topo.json), or you can preview and export/download individual geography types in various formats (TopoJSON, GeoJSON or CSV/WKT) [using this tool](https://onsvisual.github.io/uk-topojson).

- **uk** United Kingdom (K02)
- **ctry** Countries (E92, N92, S92, W92)
- **rgn** Regions (E12, N92, S92, W92)
- **cty** Counties (E10)
- **mcty** Metropolitan counties (E11)
- **cauth** Combined authorities (E47)
- **utla** Upper-tier/unitary authorities (E06, E08, E09, E10, N09, S12, W06)
- **ltla** Lower-tier/unitary authorities (E06, E08, E07, E09, N09, S12, W06)

The output file contains layers for each of the above geography types. Each area has **areacd** (GSS code) and **areanm** (official name) attributes. Areas that were created or terminated between 2014 and 2025 include a **start** and/or **end** attribute which allow them to be filtered by year.

## Running the scripts

First, you will need to install the NodeJS dependencies. Assuming you have NodeJS installed, simply run:

```bash
npm install
```

Next, you will need to run the scripts. This can be done with a single command:

```bash
npm run make-topo
```

You can preview the output locally by running the included Svelte app:

```bash
npm run dev
```

## Editing/updating the config

To update geographies for year-on-year mergers of local authorities or terminations of counties, you should only need to edit the **/input/changes.csv** file.

If you want to make more complex changes (eg. mergers or terminations of other geographies, or additons of new geography types), you will likely also need to edit **/input/ltla14_lookup.csv**, **/scripts/make-lookup.js**, and possibly other files.

## Other notes

- The base geometries used are [2016 super generalised boundaries](https://geoportal.statistics.gov.uk/search?collection=Dataset&sort=name&tags=all(BDY_LAD)%2C2016) for lower-tier/unitary local authorities.
- There were no changes in UK local authorities from 2014 to 2016, so it is assumed that the boundaries are valid from 2014 onwards.
- In 2018 and 2019 minor boundary changes were made to four local authority areas in Scotland. The updates to their GSS codes are included, but the boundaries provided here do not change (the changes would not be discernable at a super-generalised level in any case).
- In 2018, _Shepway_ was renamed _Folkestone and Hythe_ without a change to its GSS code. Only the newer name is used here.
- [Carl Baker has created a handy flow chart to let you find out which year your data might be from](https://x.com/CarlBaker/status/1377228274833702919).
