import fs from "fs";
import { csvParse, autoType } from "d3-dsv";

const data = csvParse(
  fs.readFileSync("./input/ltla14-lookup.csv", {encoding: "utf8", flag: "r"}).replace(/\uFEFF/g, ''),
  autoType
);
const changes = csvParse(
  fs.readFileSync("./input/changes.csv", {encoding: "utf8", flag: "r"}).replace(/\uFEFF/g, ''),
  autoType
);
const chg = {};
const newGeo = {};
changes.filter(c => c.type !== "new_geo").forEach(c => chg[c.oldcd] = c);
changes.filter(c => c.type === "new_geo").forEach(c => {
  if (!newGeo[c.oldcd]) newGeo[c.oldcd] = [];
  newGeo[c.oldcd].push(c);
});

// Get the years up to the latest change
const years = [14];
const latest = Math.max(...changes.map(c => c.start)) - 2000;
for (let i = years[0] + 1; i <= latest; i ++) years.push(i);
fs.mkdirSync("./output/merge", {recursive: true});
fs.writeFileSync("./output/merge/years.json", JSON.stringify(years));
fs.writeFileSync("./src/years.js", `export default ${JSON.stringify(years.map(y => y + 2000))};`);

// Generate the lookup
const lookup = [];
let current;

for (let d of data) {
  // Add 2014 codes for LTLAs and parents
  let row = {
    uk14cd: "K02000001",
    uk14nm: "United Kingdom",
    ctry14cd: d.ctrycd,
    ctry14nm: d.ctrynm,
    rgn14cd: d.rgncd,
    rgn14nm: d.rgnnm,
    ltla14cd: d.ltlacd,
    ltla14nm: d.ltlanm
  };
  ["cty", "mcty", "cauth"].forEach(key => {
    if (d[`${key}cd`]) {
      row[`${key}14cd`] = d[`${key}cd`];
      row[`${key}14nm`] = d[`${key}nm`];
    }
  });
  row.utla14cd = d.ctycd ? d.ctycd : d.ltlacd;
  row.utla14nm = d.ctycd ? d.ctynm : d.ltlanm;
  current = {
    ltla: {cd: row.ltla14cd, yr: 14},
    utla: {cd: row.utla14cd, yr: 14},
    cty: d.ctycd ? {cd: d.ctycd, yr: 14} : null,
    cauth: d.cauthcd ? {cd: d.cauthcd, yr: 14} : null
  };
  for (let yr of years.slice(1)) {
    let y = yr + 2000;

    // Create new cauths (by year)
    let cauth_new_arr = newGeo[current.ltla.cd] || newGeo[current.cty?.cd] || [];
    let cauth_new = cauth_new_arr.find(c => c.start === y);
    if (cauth_new) {
      if (current.cauth) row[`cauth${current.cauth.yr}_end`] = y - 1;
      row[`cauth${yr}cd`] = cauth_new.newcd;
      row[`cauth${yr}nm`] = cauth_new.newnm;
      row[`cauth${yr}_start`] = y;
      current.cauth = {cd: row[`cauth${yr}cd`], yr};
    }
    // Update codes for merged cauths (by year)
    let cauth_change = chg[current.cauth?.cd];
    if (cauth_change && cauth_change.start === y) {
      row[`cauth${current.cauth.yr}_end`] = y - 1;
      row[`cauth${yr}cd`] = cauth_change.newcd;
      row[`cauth${yr}nm`] = cauth_change.newnm;
      row[`cauth${yr}_start`] = y;
      current.cauth = {cd: row[`cauth${yr}cd`], yr};
    }

    // Update codes for merged ltlas (by year)
    let ltla_change = chg[current.ltla.cd];
    if (ltla_change && ltla_change.start === y) {
      row[`ltla${current.ltla.yr}_end`] = y - 1;
      row[`ltla${yr}cd`] = ltla_change.newcd;
      row[`ltla${yr}nm`] = ltla_change.newnm;
      row[`ltla${yr}_start`] = y;
      current.ltla = {cd: row[`ltla${yr}cd`], yr};
    }
    // Update codes for terminated counties
    let cty_change = current.cty ? chg[current.cty.cd] : null;
    if (cty_change && cty_change.start === y) {
      row[`cty${current.cty.yr}_end`] = y - 1;
      current.cty = null;
      // if (cty_change.newcd) {
      //   row[`cty${yr}cd`] = cty_change.newcd;
      //   row[`cty${yr}nm`] = cty_change.newnm;
      //   row[`cty${yr}_start`] = y;
      //   current.cty = {cd: row[`cty${y}cd`], yr};
      // }
    }
    // Update changed utlas
    let utla_change = (cty_change && cty_change.start === y) ||
      (ltla_change && ltla_change.start === y && row[`ltla${yr}cd`].slice(0, 3) !== "E07");
    if (utla_change) {
      row[`utla${current.utla.yr}_end`] = y - 1;
      row[`utla${yr}cd`] = row[`ltla${yr}cd`];
      row[`utla${yr}nm`] = row[`ltla${yr}nm`];
      row[`utla${yr}_start`] = y;
      current.utla = {cd: row[`utla${yr}cd`], yr};
    }
    // Update cauths

  }
  lookup.push(row);
}

fs.writeFileSync("./output/merge/lookup.json", JSON.stringify(lookup));
console.log("Generated lookup file...");