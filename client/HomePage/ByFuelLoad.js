import * as Chakra from "@chakra-ui/react";
import * as React from "react";
import useSWR from "swr";
import { AxisBottom, AxisRight } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { AreaStack } from "@visx/shape";
import { dateTimeFullFormat } from "../format";

function fetcher(...args) {
  return fetch(...args).then((r) => {
    return r.text().then((text) => ({
      lastModified: new Date(r.headers.get("last-modified")),
      table: text.split("\n").flatMap((csvRow) => {
        const trimmedRow = csvRow.trim();
        const sep = ",";
        if (!trimmedRow || trimmedRow === sep) {
          return [];
        } else {
          return [csvRow.split(sep)];
        }
      }),
    }));
  });
}

export default function ByFuelLoad() {
  const { data, error } = useSWR(`/data/raw/loadfueltype.csv`, fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });
  if (error) return <div>failed to load</div>;
  if (!data) {
    return (
      <Chakra.Center p={20}>
        <Chakra.Spinner size="xl" />
      </Chakra.Center>
    );
  }
  return (
    <React.Fragment>
      <Chakra.Heading as="h4" size="md" textAlign="right">
        現時 {dateTimeFullFormat.format(data.lastModified)}
        <br />
        <Chakra.Text as="i" fontSize="sm">
          資料來源每十分鐘自動更新
        </Chakra.Text>
      </Chakra.Heading>
      <ParentSize style={{ minHeight: 480 }}>
        {({ width, height }) =>
          width > 10 && (
            <Graph width={width} height={height} data={data.table} />
          )
        }
      </ParentSize>
    </React.Fragment>
  );
}

const FILL_COLOR_LIST = [
  undefined, // time slot
  "#CC0099",
  "#E65C00",
  "#E6E600",
  "#FFA347",
  "#006600",
  "#5EDFDF",
  "#FF1919",
  "#848484",
  "#0000B2",
  "#009933",
  "#00CC00",
  "#3366CC",
  "#6699FF",
  "#FACC2E",
];
const keys = Object.keys(FILL_COLOR_LIST);
keys.shift();

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 40 };

const gridStroke = "#e0e0e0";
const axisStroke = "#aaaaaa";
const tickStroke = "#000000";

const getX = (d) => {
  const [_, h, m] = d[0].match(/^(\d{2})\:(\d{2})$/);
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};
const getY0 = (d) => -d[0];
const getY1 = (d) => -d[1];

function Graph({
  width,
  height,
  data,
  margin = defaultMargin,
  events = false,
}) {
  // bounds
  const yMax = height - margin.top - margin.bottom;
  const xMax = width - margin.left - margin.right;

  // scales
  const xScale = scaleLinear({
    range: [0, xMax],
    domain: [0, 24 * 60],
  });
  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, -4000],
  });
  // ticks
  const xTickValues = Array(8)
    .fill(0)
    .map((_, index) => index * 3 * 60);

  return (
    <svg width={width} height={height}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="transparent"
        rx={14}
      />
      <Group top={margin.top} left={margin.left}>
        <GridRows
          scale={yScale}
          width={xMax}
          height={yMax}
          stroke={gridStroke}
        />
        <GridColumns
          scale={xScale}
          tickValues={xTickValues}
          width={xMax}
          height={yMax}
          stroke={gridStroke}
        />
        <AreaStack
          keys={keys}
          data={data}
          x={(d) => xScale(getX(d.data)) ?? 0}
          y0={(d) => yScale(getY0(d)) ?? 0}
          y1={(d) => yScale(getY1(d)) ?? 0}
        >
          {({ stacks, path }) =>
            stacks.map((stack) => (
              <path
                key={`stack-${stack.key}`}
                d={path(stack) || ""}
                stroke="transparent"
                fill={FILL_COLOR_LIST[stack.key]}
                opacity={0.6}
                onClick={() => {
                  if (events) alert(`${stack.key}`);
                }}
              />
            ))
          }
        </AreaStack>
        <text x={xMax - 40} y="-18" fontSize={14}>
          單位：萬瓩
        </text>
        <AxisRight
          left={xMax}
          scale={yScale}
          stroke={axisStroke}
          tickStroke={tickStroke}
          tickFormat={(y) => {
            return -1 * y;
          }}
          tickLabelProps={() => ({
            fill: tickStroke,
            fontSize: 11,
            textAnchor: "end",
            dy: "-0.33em",
          })}
        />
        <AxisBottom
          top={yMax}
          scale={xScale}
          stroke={axisStroke}
          tickValues={xTickValues}
          tickStroke={tickStroke}
          tickFormat={(x) => {
            const hour = `${Math.floor(x / 60)}`;
            const minute = `${x % 60}`;
            return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
          }}
          tickLabelProps={() => ({
            fill: tickStroke,
            fontSize: 11,
            textAnchor: "middle",
          })}
        />
      </Group>
    </svg>
  );
}
