import fs from "fs";
import { execSync } from "child_process";
import mapshaper from "mapshaper";

const keys = ["ltla", "utla", "cty", "mcty", "cauth", "rgn", "ctry", "uk"];
const inDir = "./output/merge";
const outDir = "./output/layers";

const years = JSON.parse(
  fs.readFileSync(`${inDir}/years.json`, {encoding: "utf8", flag: "r"})
);
const lookup = JSON.parse(
  fs.readFileSync(`${inDir}/lookup.json`, {encoding: "utf8", flag: "r"})
);

// Clear output directory
try {
  execSync(`rm -r ${outDir}/*`);
  console.log(`Emptied folder ${outDir}`);
}
catch {
  console.log(`No files to delete in ${outDir}`);
}

// Generate GeoJSON for each year of each geography
const layers = [];
keys.forEach(key => {
  years.forEach(y => {
    if (lookup.find(l => l[`${key}${y}cd`])) {
      mapshaper.runCommands(`-i ${inDir}/ltla-merge.json -rename-fields areacd=${key}${y}cd,areanm=${key}${y}nm -filter 'areacd !== undefined' -dissolve2 areacd,areanm name=${key}${y} -clean -o ${outDir}/${key}${y}.json format=geojson`);
      layers.push(`${key}${y}`);
    }
  });
});
console.log("Generated GeoJSON for each geography + unique year...");