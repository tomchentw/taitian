import * as Chakra from "@chakra-ui/react";
import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { subDays } from "date-fns";
import useSWR from "swr";
import {
  Axis,
  Grid,
  AnimatedAreaStack,
  AnimatedAreaSeries,
  XYChart,
  Tooltip,
  TooltipContext,
  TooltipProvider,
} from "@visx/xychart";
import { curveLinear } from "@visx/curve";
import { toISODateForInput, dateTimeFullFormat } from "../format";
import Loading from "./Loading";

const MIN_DATE = toISODateForInput(new Date(2021, 4, 20));
const TODAY = new Date();

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
  const maxDate = toISODateForInput(TODAY);
  const [date, setDate] = React.useState(maxDate);
  const onChange = React.useCallback(
    (arg) => {
      const value = arg?.target?.value ?? arg;
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
  const { data: nullableResponse, error } = useSWR(
    maxDate === date
      ? `/data/raw/loadfueltype.csv`
      : `/data/accumulated/${date.split("-").join("/")}/loadfueltype.csv`,
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000,
    }
  );
  const cachedResponse = React.useRef(nullableResponse);
  React.useEffect(() => {
    if (nullableResponse) {
      cachedResponse.current = nullableResponse;
    }
  }, [nullableResponse]);
  if (error) return <div>failed to load</div>;
  const activeResponse = nullableResponse || cachedResponse.current;
  if (!activeResponse) {
    return <Loading />;
  }
  return (
    <React.Fragment>
      <Chakra.Heading as="h4" size="md" textAlign="right">
        現時 {dateTimeFullFormat.format(activeResponse.lastModified)}
        <br />
        <Chakra.Text as="i" fontSize="sm">
          資料來源每十分鐘自動更新
        </Chakra.Text>
      </Chakra.Heading>
      <Chakra.FormControl
        id="date"
        mt={4}
        as={Chakra.Stack}
        spacing={2}
        direction={["column", , "row"]}
        alignItems={[, , "center"]}
      >
        <Chakra.FormLabel flexShrink="0" mb={[, 0]}>
          選擇日期
        </Chakra.FormLabel>
        <Chakra.Input
          flexShrink="0"
          flexBasis={["100%", , 48]}
          type="date"
          min={MIN_DATE}
          max={maxDate}
          value={date}
          onChange={onChange}
        />
        <Chakra.RadioGroup value={date} onChange={onChange}>
          <Chakra.HStack>
            <Chakra.Radio value={maxDate}>今天</Chakra.Radio>
            <Chakra.Radio value={toISODateForInput(subDays(TODAY, 1))}>
              昨天
            </Chakra.Radio>
            <Chakra.Radio value={toISODateForInput(subDays(TODAY, 2))}>
              前天
            </Chakra.Radio>
          </Chakra.HStack>
        </Chakra.RadioGroup>
        <Chakra.FormHelperText>
          最早可選日期為：{MIN_DATE}
        </Chakra.FormHelperText>
      </Chakra.FormControl>
      <ErrorBoundary
        fallback={
          <Chakra.Center p={[4, 10, 20]}>
            <Chakra.Text as="em" color="red">
              You select a date with a broken data. <br />
              Try another one!
            </Chakra.Text>
          </Chakra.Center>
        }
        resetKeys={[activeResponse.table]}
      >
        <VXContexualGraph table={activeResponse.table} />
      </ErrorBoundary>
    </React.Fragment>
  );
}

function VXContexualGraph({ table }) {
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

  return (
    <TooltipProvider>
      <Chakra.Stack direction={["column", , "row"]} spacing={2} mt={4}>
        <Chakra.List
          order={[2, , 0]}
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
                <TooltipLoadInfo index={index} />
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
          width="100%"
          height={600}
          order={1}
          sx={{
            "& svg path": {
              transition: "opacity 0.2s ease-in-out",
            },
          }}
        >
          <Graph hoveringYIndex={hoveringYIndex} table={table} />
        </Chakra.Box>
      </Chakra.Stack>
    </TooltipProvider>
  );
}

function getNearestDatumFrom(tooltipContext) {
  if (!tooltipContext.tooltipOpen) {
    return false;
  }
  const {
    tooltipData: { nearestDatum },
  } = tooltipContext;
  if (nearestDatum.distance > 5) {
    return false;
  }
  return nearestDatum;
}

function TooltipLoadInfo({ index }) {
  const tooltipContext = React.useContext(TooltipContext);
  const nearestDatum = getNearestDatumFrom(tooltipContext);
  return (
    `${index + 1}` === nearestDatum?.key && (
      <>
        <br />
        {nearestDatum.datum[index + 1]}
      </>
    )
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

const defaultMargin = { top: 0, right: 30, bottom: 30, left: 20 };

const gridStroke = "#e0e0e0";
const axisStroke = "#aaaaaa";
const tickStroke = "#000000";

const getX = (d) => {
  const [_, h, m] = d[0].match(/^(\d{2})\:(\d{2})$/);
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};
const getYByKey = (key) => (d) => d[key];

const xTickValues = Array(8)
  .fill(0)
  .map((_, index) => index * 3 * 60);

function Graph({ hoveringYIndex, table }) {
  return (
    <XYChart
      xScale={{ type: "linear", domain: [0, 24 * 60] }}
      yScale={{ type: "linear", domain: [0, 4000] }}
      theme={{
        gridStyles: {
          stroke: gridStroke,
        },
      }}
      margin={defaultMargin}
    >
      <Grid rows={true} columns={false} />
      <Grid rows={false} tickValues={xTickValues} columns={true} />
      <AnimatedAreaStack curve={curveLinear} renderLine={false}>
        {keys.map((key, index) => (
          <AnimatedAreaSeries
            key={key}
            dataKey={key}
            data={table}
            xAccessor={getX}
            yAccessor={getYByKey(key)}
            fill={Y_RANGE[index].color}
            fillOpacity={
              hoveringYIndex === -1 ? 0.6 : hoveringYIndex === index ? 1 : 0.2
            }
          />
        ))}
      </AnimatedAreaStack>
      <Axis
        orientation="right"
        label="單位：萬瓩"
        axisLabel={{ fontSize: 14, dx: "0.3em" }}
      />
      <Axis
        orientation="bottom"
        tickValues={xTickValues}
        tickFormat={(x) => {
          const hour = `${Math.floor(x / 60)}`;
          const minute = `${x % 60}`;
          return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
        }}
      />
      <Tooltip
        showHorizontalCrosshair={false}
        showVerticalCrosshair={true}
        snapTooltipToDatumX={true}
        snapTooltipToDatumY={true}
        renderTooltip={(tooltipContext) => {
          const nearestDatum = getNearestDatumFrom(tooltipContext);
          if (!nearestDatum) {
            return false;
          }
          return <>{nearestDatum.datum[0]}</>;
        }}
      />
    </XYChart>
  );
}
