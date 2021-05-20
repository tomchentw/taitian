import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import spawn from "cross-spawn";
import crawl from "./crawl.mjs";
import accumulate from "./accumulate.mjs";
import logger from "./logger.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  // Prepare data folder to work with
  if (!process.env.CI) {
    spawn.sync("rm", ["-rf", "public/data"], { stdio: "inherit" });
  }
  spawn.sync("git", ["restore", "--source=origin/gh-pages", "data"], {
    stdio: "inherit",
  });
  spawn.sync("mv", ["data", "public/data"], { stdio: "inherit" });

  await crawl();
  await accumulate();
}

run()
  .then((it) => {
    logger.info("Done!");
  })
  .catch((error) => {
    logger.fatal(error);
  });
