import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);

const INTERVAL = 60 * 1000; // 1 minute
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

const httpsAgent = new https.Agent({
  keepAlive: true,
});

export default async function crawl() {
  await fs.promises.mkdir(RAW_DIR, { recursive: true });
  await Promise.all(
    URL_LIST.map(async ({ pathname, url }) => {
      while (true) {
        const dataPath = path.join(RAW_DIR, pathname);
        const [text, prevText] = await Promise.all([
          fetch(url, { agent: httpsAgent }).then((r) => r.text()),
          fs.promises.readFile(dataPath, "utf-8").catch((error) => {
            if ("ENOENT" !== error.code) {
              throw error;
            }
          }),
        ]);
        if (text !== prevText) {
          await fs.promises.writeFile(dataPath, text);
          return;
        } else {
          await new Promise((resolve) => setTimeout(resolve, INTERVAL));
        }
      }
    })
  );
}
