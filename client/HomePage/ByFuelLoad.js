import * as Chakra from "@chakra-ui/react";
import * as React from "react";
import useSWR from "swr";
import { AxisBottom, AxisRight } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { AreaStack } from "@visx/shape";
import { toISODateForInput, dateTimeFullFormat } from "../format";
import Loading from "./Loading";

const MIN_DATE = toISODateForInput(new Date(2021, 4, 20));

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
  const maxDate = toISODateForInput(new Date());
  const [date, setDate] = React.useState(maxDate);
  const onChange = React.useCallback(
    ({ target: { value } }) => {
      if (MIN_DATE <= value && value <= maxDate) {
        /**
         * For some browser (ex. Mobile Firefox), the <input type="date" /> does
         * not honor min and max attributes.
         */
        setDate(value);
      }
    },
    [setDate]
  );
  const { data: response, error } = useSWR(
    maxDate === date
      ? `/data/raw/loadfueltype.csv`
      : `/data/accumulated/${date.split("-").join("/")}/loadfueltype.csv`,
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
    }
  );
  const [hoveringYIndex, setHoveringYIndex] = React.useState(-1);
  const onMouseEnter = React.useCallback(
    ({ currentTarget: { dataset } }) => {
      setHoveringYIndex(parseInt(dataset.index, 10));
    },
    [setHoveringYIndex]
  );
  const onMouseLeave = React.useCallback(() => {
    setHoveringYIndex(-1);
  }, [setHoveringYIndex]);
  if (error) return <div>failed to load</div>;
  if (!response) {
    return <Loading />;
  }
  return (
    <React.Fragment>
      <Chakra.Heading as="h4" size="md" textAlign="right">
        現時 {dateTimeFullFormat.format(response.lastModified)}
        <br />
        <Chakra.Text as="i" fontSize="sm">
          資料來源每十分鐘自動更新
        </Chakra.Text>
      </Chakra.Heading>
      <Chakra.FormControl
        id="date"
        mt={4}
        display="flex"
        maxW={[, "450px"]}
        direction={["column", "row"]}
        alignItems="center"
      >
        <Chakra.FormLabel flexShrink="0" mb={[, 0]}>
          選擇日期
        </Chakra.FormLabel>
        <Chakra.Input
          flex="1 0"
          type="date"
          min={MIN_DATE}
          max={maxDate}
          value={date}
          onChange={onChange}
        />
        <Chakra.FormHelperText pl={[, 2]}>
          最早可選日期為：{MIN_DATE}
        </Chakra.FormHelperText>
      </Chakra.FormControl>
      <Chakra.Stack direction={["column", , "row"]} spacing={2} mt={4}>
        <Chakra.List
          order={[, , -1]}
          minWidth={[, , 36]}
          spacing={2}
          alignSelf="center"
        >
          {Y_RANGE.map(({ title, color }, index) => (
            <Chakra.ListItem
              key={title}
              display="flex"
              alignContent="center"
              cursor="pointer"
              data-index={index}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <Chakra.Text fontSize="sm" flex="1">
                {title}
              </Chakra.Text>
              <Chakra.Circle
                size={6}
                transition="opacity 0.2s ease-in-out"
                opacity={
                  hoveringYIndex === -1
                    ? 0.6
                    : hoveringYIndex === index
                    ? 1
                    : 0.2
                }
                bgColor={color}
                ml={4}
              />
            </Chakra.ListItem>
          )).reverse()}
        </Chakra.List>
        <Chakra.Box
          as={ParentSize}
          minHeight={600}
          order={0}
          sx={{
            "& svg path": {
              transition: "opacity 0.2s ease-in-out",
            },
          }}
        >
          {({ width, height }) =>
            width > 10 && (
              <Graph
                width={width}
                height={height}
                hoveringYIndex={hoveringYIndex}
                onMouseEnterYIndex={onMouseEnter}
                onMouseLeaveYIndex={onMouseLeave}
                table={response.table}
              />
            )
          }
        </Chakra.Box>
      </Chakra.Stack>
    </React.Fragment>
  );
}

const Y_RANGE = [
  { title: "核能(Nuclear)", color: "#CC0099" },
  { title: "燃煤(Coal)", color: "#E65C00" },
  { title: "汽電共生(Co-Gen)", color: "#E6E600" },
  { title: "民營電廠-燃煤(IPP Coal)", color: "#FFA347" },
  { title: "燃氣(LNG)", color: "#006600" },
  { title: "民營電廠-燃氣(IPP LNG)", color: "#5EDFDF" },
  { title: "重油(Oil)", color: "#FF1919" },
  { title: "輕油(Diesel)", color: "#848484" },
  { title: "水力(Hydro)", color: "#0000B2" },
  { title: "風力(Wind)", color: "#009933" },
  { title: "太陽能(Solar)", color: "#00CC00" },
  { title: "抽蓄發電(Pumping Gen)", color: "#3366CC" },
  { title: "抽蓄負載(Pump Load)", color: "#6699FF" },
];
const keys = Object.keys([null /*time slot */].concat(Y_RANGE)).slice(1);

const defaultMargin = { top: 40, right: 10, bottom: 50, left: 20 };

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
  hoveringYIndex,
  onMouseEnterYIndex,
  onMouseLeaveYIndex,
  table,
  margin = defaultMargin,
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
          data={table}
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
                fill={Y_RANGE[stack.index].color}
                opacity={
                  hoveringYIndex === -1
                    ? 0.6
                    : hoveringYIndex === stack.index
                    ? 1
                    : 0.2
                }
                data-index={stack.index}
                onMouseEnter={onMouseEnterYIndex}
                onMouseLeave={onMouseLeaveYIndex}
              />
            ))
          }
        </AreaStack>
        <text x={xMax - 60} y="-18" fontSize={14}>
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
