import * as Chakra from "@chakra-ui/react";
import * as React from "react";
import useSWR from "swr";
import Loading from "./Loading";

function fetcherJson(...args) {
  return fetch(...args).then((r) => r.json());
}

export default function TodayData() {
  const { data, error } = useSWR(`/data/raw/loadpara.json`, fetcherJson, {
    refreshInterval: 5 * 60 * 1000,
  });

  if (error) return <div>failed to load</div>;
  if (!data) {
    return <Loading />;
  }
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
  } = data;

  return (
    <React.Fragment>
      <Chakra.Heading as="h4" size="md" textAlign="right">
        現時 {publish_time}
        <br />
        <Chakra.Text as="i" fontSize="sm">
          資料來源每十分鐘自動更新
        </Chakra.Text>
      </Chakra.Heading>
      <Chakra.SimpleGrid
        columns={[2, , 4]}
        spacing={10}
        py={20}
        as={Chakra.StatGroup}
      >
        <Chakra.Stat>
          <Chakra.StatLabel>目前使用率</Chakra.StatLabel>
          <Chakra.StatNumber> {curr_util_rate}%</Chakra.StatNumber>
          <Chakra.StatHelpText>目前用電量 {curr_load} 萬瓩</Chakra.StatHelpText>
        </Chakra.Stat>
        <Chakra.Stat>
          <Chakra.StatLabel>尖峰使用率</Chakra.StatLabel>
          <Chakra.StatNumber>
            {((100 * fore_peak_dema_load) / fore_maxi_sply_capacity).toFixed(0)}
            %
          </Chakra.StatNumber>
          <Chakra.StatHelpText>
            預估最高用電 {fore_peak_dema_load} 萬瓩
          </Chakra.StatHelpText>
        </Chakra.Stat>
        <Chakra.Stat>
          <Chakra.StatLabel>最大供電能力</Chakra.StatLabel>
          <Chakra.StatNumber>{fore_maxi_sply_capacity} 萬瓩</Chakra.StatNumber>
          <Chakra.StatHelpText>
            預估最高用電時段 {fore_peak_hour_range}
          </Chakra.StatHelpText>
        </Chakra.Stat>
        <Chakra.Stat>
          <Chakra.StatLabel>燈號</Chakra.StatLabel>
          <Chakra.StatNumber>
            <Chakra.Circle
              size="40px"
              bg={
                {
                  G: "green",
                  Y: "yellow",
                  O: "orange",
                  R: "tomato",
                  B: "black",
                }[fore_peak_resv_indicator]
              }
            />
          </Chakra.StatNumber>
        </Chakra.Stat>
      </Chakra.SimpleGrid>
      <Chakra.Box as="pre" py={4} display="none">
        <Chakra.Code>{JSON.stringify(data, null, 2)}</Chakra.Code>
      </Chakra.Box>
    </React.Fragment>
  );
}
