import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as _ from "lodash-es";
import logger from "./logger.mjs";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);
const ACCUMULATED_DIR = path.join(DIRNAME, `../public/data/accumulated`);

const taipeiFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Taipei",
});

function parseJson(string) {
  return JSON.parse(string);
}

function splitNewLine(string) {
  return string.split("\n");
}

async function genaryToCSV(accumulatedDirPath) {
  const sourceFilePath = path.join(RAW_DIR, "genary.json");
  const accumulatedFilePath = path.join(accumulatedDirPath, "genary_col.csv");
  const [{ "": datetime, aaData }, accumulatedCSV] = await Promise.all([
    fs.promises.readFile(sourceFilePath, "utf-8").then(parseJson),
    fs.promises
      .readFile(accumulatedFilePath, "utf-8")
      .then(splitNewLine, (error) => {
        if ("ENOENT" !== error.code) {
          throw error;
        }
        return [`type,name,capacity\n`];
      }),
  ]);
  const [date, time] = datetime.split(" ");
  let headerRow = _.head(accumulatedCSV);
  if (headerRow.includes(`time-${time}`)) {
    return;
  }
  headerRow = `${accumulatedCSV[0].trim()},time-${time},generation-${time},note-${time}\n`;
  let appendedCSV;
  if (1 === accumulatedCSV.length) {
    appendedCSV = aaData
      .map(
        ([
          htmlType,
          name,
          capacity,
          generation,
          ,
          /* percentage */ rawNote,
        ]) => {
          const [_, type] = htmlType.match(/^<A NAME='(\S+)'>.+$/);
          const note = rawNote.trim();
          return [type, name, capacity, time, generation, note];
        }
      )
      .reduce((acc, it) => `${acc}${it.join(",")}\n`, headerRow);
  } else {
    appendedCSV = aaData
      .map(([, , , generation, , rawNote]) => {
        const note = rawNote.trim();
        return [time, generation, note];
      })
      .reduce(
        (acc, it, index) =>
          `${acc}${accumulatedCSV[index + 1].trim()},${it.join(",")}\n`,
        headerRow
      );
  }
  await fs.promises.writeFile(accumulatedFilePath, appendedCSV);
}

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
  const [{ value: month }, , { value: day }, , { value: year }] =
    taipeiFormat.formatToParts(closeToMindnight);
  const accumulatedDirPath = path.join(ACCUMULATED_DIR, year, month, day);
  await fs.promises.mkdir(accumulatedDirPath, { recursive: true });
  // Every interval
  await Promise.all([genaryToCSV(accumulatedDirPath)]);
  // Only before Midnight
  if (new Date() < closeToMindnight) {
    return;
  }
  await Promise.all([
    loadfueltype(accumulatedDirPath),
    loadareas(accumulatedDirPath),
  ]);
}
