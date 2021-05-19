import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crawl from "./crawl.mjs";
import accumulate from "./accumulate.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  await crawl();
  await accumulate();
}

run()
  .then((it) => {
    console.log(`Done`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
