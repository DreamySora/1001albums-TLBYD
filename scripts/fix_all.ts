import { readFileSync, writeFileSync } from "fs";

for (let i = 1; i <= 6; i++) {
  const path = `/home/franc/Documenti/Opencode/project1/1001Albums_TLBFYD/src/data/raw-${i}.ts`;
  let content = readFileSync(path, "utf-8");
  
  // Fix the Royce da 5'9" issue
  content = content.replace(/"Royce da 5'9\\\\\\""/g, '"Royce da 5\'9\""');
  content = content.replace(/"Royce da 5'9\\\\""/g, '"Royce da 5\'9\""');
  content = content.replace(/"Royce da 5'9\\""/g, '"Royce da 5\'9\""');
  
  // Fix any other double-escaped quotes
  content = content.replace(/\\\\\\"/g, '\\\\"');
  content = content.replace(/\\\\"/g, '\\\\"');
  
  writeFileSync(path, content);
  console.log(`Fixed raw-${i}.ts`);
}

console.log("Done!");