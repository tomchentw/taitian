import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import spawn from "cross-spawn";
import crawl from "./crawl.mjs";
import accumulate from "./accumulate.mjs";
import logger from "./logger.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_FN_BY = {
  crawl,
  accumulate,
};

async function run([commandName]) {
  // Prepare data folder to work with
  if (!process.env.CI) {
    spawn.sync("rm", ["-rf", "public/data"], { stdio: "inherit" });
  }
  spawn.sync("git", ["restore", "--source=origin/gh-pages", "data"], {
    stdio: "inherit",
  });
  spawn.sync("mv", ["data", "public/data"], { stdio: "inherit" });

  const commandFn = COMMAND_FN_BY[commandName];
  await commandFn();
}

run(process.argv.slice(2))
  .then((it) => {
    logger.info("Done!");
  })
  .catch((error) => {
    logger.fatal(error);
  });
