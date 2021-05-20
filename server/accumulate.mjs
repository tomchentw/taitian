import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as _ from "lodash-es";
import fetch from "node-fetch";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);
const ACCUMULATED_DIR = path.join(DIRNAME, `../public/data/accumulated`);

const taipeiFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Taipei",
});

async function loadfueltype() {
  const now = new Date();
  const closeToMindnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    50
  );
  if (now < closeToMindnight) {
    return;
  }
  const [{ value: month }, , { value: day }, , { value: year }] =
    taipeiFormat.formatToParts(closeToMindnight);
  const sourceFilePath = path.join(RAW_DIR, "loadfueltype.csv");
  const accumulatedDirPath = path.join(ACCUMULATED_DIR, year, month, day);
  await fs.promises.mkdir(accumulatedDirPath, { recursive: true });
  const accumulatedFilePath = path.join(accumulatedDirPath, "loadfueltype.csv");
  await fs.promises.copyFile(sourceFilePath, accumulatedFilePath);
}

export default async function accumulate() {
  await Promise.all([loadfueltype()]);
}
