import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crawl from "./crawl.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const TIMEPATH = path.join(DIRNAME, `../public/data/time`);
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);

const INTERVAL = 10 * 60 * 1000; // 10 minutes
const EXECUTION_TIME = 3 * 1000; // 3 seconds

async function run() {
  // Setup
  await Promise.allSettled([
    fs.promises.mkdir(RAW_DIR, { recursive: true }),
    process.env.CI
      ? (async () => {
          const prevExecuteAt = parseInt(
            await fs.promises.readFile(TIMEPATH, "utf-8")
          );
          const difference = Date.now() - prevExecuteAt;
          if (difference < INTERVAL - EXECUTION_TIME) {
            await new Promise((resolve) =>
              setTimeout(resolve, INTERVAL - EXECUTION_TIME - difference)
            );
          }
        })()
      : Promise.resolve(),
  ]);
  // Exec
  await crawl();
  // Finish
  fs.writeFileSync(TIMEPATH, `${Date.now()}`);
}

run()
  .then((it) => {
    console.log(`Done`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
