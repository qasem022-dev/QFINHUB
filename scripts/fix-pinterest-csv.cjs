#!/usr/bin/env node
const fs = require("fs");

const images = fs.readdirSync(".pinterest-data/images").filter(f => f.endsWith(".png"));
const slugToFile = {};
for (const img of images) {
  const match = img.match(/^batch-(.+)-[a-f0-9]+\.png$/);
  if (match) slugToFile[match[1]] = img;
}
console.log("Mapped " + Object.keys(slugToFile).length + " slugs to images");

const content = JSON.parse(fs.readFileSync(".pinterest-data/pin-content.json","utf-8"));
const pins = content.pins || [];

const catToBoard = {
  "mortgages": "Mortgage Calculators",
  "investing": "Investment Calculators",
  "retirement": "Retirement Planning",
  "loans": "Loan Calculators",
  "debt": "Debt Payoff Tools",
  "taxes": "Tax Calculators",
  "savings": "Savings and Budget",
  "everyday": "Everyday Calculators",
};

const esc = s => String(s).replace(/"/g, '""').replace(/#\w+/g, "").trim();

let csv = "title,description,link,image_url,board\n";
let count = 0;
let missing = [];

for (const pin of pins) {
  const slug = pin.slug || "";
  const imageFile = slugToFile[slug];
  if (!imageFile) { missing.push(slug); continue; }

  const title = esc(pin.title || "").substring(0, 100);
  const desc = esc(pin.description || "").substring(0, 500);
  const link = pin.link || "https://www.qfinhub.com/calculators/" + slug;
  const board = catToBoard[pin.category] || catToBoard[pin.boardName] || "Everyday Calculators";
  const imageUrl = "https://www.qfinhub.com/pins/" + imageFile;

  csv += '"' + title + '","' + desc + '","' + link + '","' + imageUrl + '","' + board + '"\n';
  count++;
}

fs.writeFileSync("public/pinterest-upload.csv", csv);
console.log("Generated: " + count + " pins, " + (csv.length/1024).toFixed(1) + " KB");
if (missing.length > 0) console.log("Missing images for: " + missing.slice(0, 10).join(", "));

// Show sample
const lines = csv.split("\n");
console.log("\nSample (first 3 rows):");
console.log(lines.slice(0, 4).join("\n"));
