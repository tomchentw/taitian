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

async function genary(accumulatedDirPath) {
  const sourceFilePath = path.join(RAW_DIR, "genary.json");
  const accumulatedFilePath = path.join(accumulatedDirPath, "genary.json");
  const [{ "": datetime, aaData }, accumulated] = await Promise.all([
    fs.promises.readFile(sourceFilePath, "utf-8").then(parseJson),
    fs.promises
      .readFile(accumulatedFilePath, "utf-8")
      .then(parseJson, (error) => {
        if ("ENOENT" !== error.code) {
          throw error;
        }
        return {
          date: "",
          data: [],
        };
      }),
  ]);
  const [date, time] = datetime.split(" ");
  if (!accumulated.date) {
    accumulated.date = date;
  }
  if (accumulated.date !== date) {
    // Don't do anything
    logger.error("[accumulate#genary] date mismatch!", accumulated.date, date);
    return;
  }
  const entry = {
    time,
    generators: aaData.map(
      ([htmlType, name, capacity, generation, percentage, rawNote]) => {
        const [_, type] = htmlType.match(/^<A NAME='(\S+)'>.+$/);
        const note = rawNote.trim();
        return { type, name, capacity, generation, percentage, note };
      }
    ),
  };
  if (_.isEqual(_.last(accumulated.data), entry)) {
    return;
  }
  accumulated.data.push(entry);
  await fs.promises.writeFile(
    accumulatedFilePath,
    JSON.stringify(accumulated, null, 2)
  );
}

async function genaryToCSV(accumulatedDirPath) {
  const sourceFilePath = path.join(RAW_DIR, "genary.json");
  const accumulatedFilePath = path.join(accumulatedDirPath, "genary.csv");
  const [{ "": datetime, aaData }, accumulatedCSV] = await Promise.all([
    fs.promises.readFile(sourceFilePath, "utf-8").then(parseJson),
    fs.promises.readFile(accumulatedFilePath, "utf-8").catch((error) => {
      if ("ENOENT" !== error.code) {
        throw error;
      }
      return "time,type,name,capacity,generation,percentage,note\n";
    }),
  ]);
  const [date, time] = datetime.split(" ");
  function transformToEntry([
    htmlType,
    name,
    capacity,
    generation,
    percentage,
    rawNote,
  ]) {
    const [_, type] = htmlType.match(/^<A NAME='(\S+)'>.+$/);
    const note = rawNote.trim();
    return [time, type, name, capacity, generation, percentage, note];
  }
  const lastEntry = transformToEntry(_.last(aaData));
  if (_.isEqual(_.last(accumulatedCSV.split("\n")), lastEntry)) {
    return;
  }
  const appendedCSV = aaData
    .map(transformToEntry)
    .reduce((acc, it) => `${acc}${it.join(",")}\n`, "");
  await fs.promises.appendFile(accumulatedFilePath, appendedCSV);
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
