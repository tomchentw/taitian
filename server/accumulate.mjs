import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as _ from "lodash-es";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);
const ACCUMULATED_DIR = path.join(DIRNAME, `../public/data/accumulated`);

const taipeiFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Taipei",
});

async function loadfueltype(accumulatedDirPath) {
  const sourceFilePath = path.join(RAW_DIR, "loadfueltype.csv");
  const accumulatedFilePath = path.join(accumulatedDirPath, "loadfueltype.csv");
  await fs.promises.copyFile(sourceFilePath, accumulatedFilePath);
}

async function loadareas(accumulatedDirPath) {
  const sourceFilePath = path.join(RAW_DIR, "loadareas.csv");
  const accumulatedFilePath = path.join(accumulatedDirPath, "loadareas.csv");
  await fs.promises.copyFile(sourceFilePath, accumulatedFilePath);
}

export default async function accumulate() {
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
  const accumulatedDirPath = path.join(ACCUMULATED_DIR, year, month, day);
  await fs.promises.mkdir(accumulatedDirPath, { recursive: true });
  await Promise.all([
    loadfueltype(accumulatedDirPath),
    loadareas(accumulatedDirPath),
  ]);
}
