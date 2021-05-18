import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const TIMEPATH = path.join(DIRNAME, `../public/data/time`);
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);

const URL_LIST = [
  {
    pathname: `loadpara.json`,
    url: `https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.json`,
  },
];

async function run() {
  await fs.promises.mkdir(RAW_DIR, { recursive: true });
  await Promise.allSettled(
    URL_LIST.map(async ({ pathname, url }) => {
      const text = await fetch(url).then((r) => r.text());
      const dataPath = path.join(RAW_DIR, pathname);
      await fs.promises.writeFile(dataPath, text);
    }),
    fs.promises.writeFile(TIMEPATH, `${Date.now()}`)
  );
}

run()
  .then((it) => {
    console.log(`Done`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
