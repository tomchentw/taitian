import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as _ from "lodash-es";
import fetch from "node-fetch";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(DIRNAME, `../public/data/raw`);
const ACCUMULATED_DIR = path.join(DIRNAME, `../public/data/accumulated`);

const jsonParser = JSON.parse.bind(JSON);

async function loadpara() {
  const {
    records: [
      { curr_load, curr_util_rate },
      {
        fore_maxi_sply_capacity,
        fore_peak_dema_load,
        fore_peak_resv_capacity,
        fore_peak_resv_rate,
        fore_peak_resv_indicator,
        fore_peak_hour_range,
        publish_time,
      },
      {
        yday_date,
        yday_maxi_sply_capacity,
        yday_peak_dema_load,
        yday_peak_resv_capacity,
        yday_peak_resv_rate,
        yday_peak_resv_indicator,
      },
    ],
  } = await fs.promises
    .readFile(path.join(RAW_DIR, "loadpara.json"))
    .then(jsonParser);
  const item = [
    curr_load,
    curr_util_rate,
    fore_maxi_sply_capacity,
    fore_peak_dema_load,
    fore_peak_resv_capacity,
    fore_peak_resv_rate,
    fore_peak_resv_indicator,
    fore_peak_hour_range,
    publish_time,
    yday_date,
    yday_maxi_sply_capacity,
    yday_peak_dema_load,
    yday_peak_resv_capacity,
    yday_peak_resv_rate,
    yday_peak_resv_indicator,
  ];
  const [, legacyYear, month2Digit, day2Digit, zhDayOfTheWeek, hour, minute] =
    publish_time.match(
      // "110.05.19(三)02:20", "110.05.19(三)17:10",
      /^(\d{3})\.(\d{2})\.(\d{2})\((\S)\)(\d{2})\:(\d{2})$/
    );
  const year = 1911 + _.parseInt(legacyYear);

  const accumulatedDirPath = path.join(
    ACCUMULATED_DIR,
    `${year}`,
    month2Digit,
    day2Digit
  );
  const accumulatedFilePath = path.join(accumulatedDirPath, "loadpara.json");
  const [accumulated] = await Promise.all([
    fs.promises.readFile(accumulatedFilePath).then(jsonParser, (error) => {
      if ("ENOENT" !== error.code) {
        throw error;
      }
      return {
        _v: "1",
        date: `${year}-${month2Digit}-${day2Digit}`,
        zhDayOfTheWeek,
        headers: [
          "curr_load",
          "curr_util_rate",
          "fore_maxi_sply_capacity",
          "fore_peak_dema_load",
          "fore_peak_resv_capacity",
          "fore_peak_resv_rate",
          "fore_peak_resv_indicator",
          "fore_peak_hour_range",
          "publish_time",
          "yday_date",
          "yday_maxi_sply_capacity",
          "yday_peak_dema_load",
          "yday_peak_resv_capacity",
          "yday_peak_resv_rate",
          "yday_peak_resv_indicator",
        ],
        data: [],
      };
    }),
    fs.promises.mkdir(accumulatedDirPath, { recursive: true }),
  ]);
  if (_.isEqual(item, _.last(accumulated.data))) {
    return;
  }
  accumulated.data.push(item);
  await fs.promises.writeFile(
    accumulatedFilePath,
    JSON.stringify(accumulated, null, 2)
  );
}

export default async function accumulate() {
  await Promise.all([loadpara()]);
}
