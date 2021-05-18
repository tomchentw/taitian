import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);

const URL_LIST = [
  {
    pathname: `loadpara.json`,
    url: `https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.json`,
  },
  {
    pathname: `loadfueltype.csv`,
    url: `https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadfueltype.csv`,
  },
];

export default async function crawl() {
  await Promise.allSettled(
    URL_LIST.map(async ({ pathname, url }) => {
      const text = await fetch(url).then((r) => r.text());
      const dataPath = path.join(RAW_DIR, pathname);
      await fs.promises.writeFile(dataPath, text);
    })
  );
}
