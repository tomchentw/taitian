import * as Chakra from "@chakra-ui/react";
import Head from "next/head";
import * as React from "react";
import useSWR from "swr";

function fetcherJson(...args) {
  return fetch(...args).then((r) => r.json());
}

function TodayData() {
  const { data, error } = useSWR(
    `/taitian/data/raw/loadpara.json`,
    fetcherJson
  );

  if (error) return <div>failed to load</div>;
  if (!data) {
    return (
      <Chakra.Center p={20}>
        <Chakra.Spinner size="xl" />
      </Chakra.Center>
    );
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
      <Chakra.Heading as="h3" size="lg" textAlign="right">
        {publish_time} 更新
      </Chakra.Heading>
      <Chakra.SimpleGrid
        columns={[2, , 4]}
        spacing={10}
        py={20}
        as={Chakra.StatGroup}
      >
        <Chakra.Stat>
          <Chakra.StatLabel>目前用電量</Chakra.StatLabel>
          <Chakra.StatNumber>{curr_load} 萬瓩</Chakra.StatNumber>
          <Chakra.StatHelpText>
            目前使用率 {curr_util_rate}%
          </Chakra.StatHelpText>
        </Chakra.Stat>
        <Chakra.Stat>
          <Chakra.StatLabel>預估最高用電</Chakra.StatLabel>
          <Chakra.StatNumber>{fore_peak_dema_load} 萬瓩</Chakra.StatNumber>
          <Chakra.StatHelpText>
            尖峰使用率{" "}
            {((100 * fore_peak_dema_load) / fore_maxi_sply_capacity).toFixed(0)}
            %
          </Chakra.StatHelpText>
        </Chakra.Stat>
        <Chakra.Stat>
          <Chakra.StatLabel>預估最高用電時段</Chakra.StatLabel>
          <Chakra.StatNumber>{fore_peak_hour_range}</Chakra.StatNumber>
          <Chakra.StatHelpText>
            最大供電能力 {fore_maxi_sply_capacity} 萬瓩
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
                  R: "tomato",
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

export default function Home() {
  return (
    <React.Fragment>
      <Chakra.Container as="header">
        <Chakra.Heading size="4xl" textAlign="center" py={20}>
          台電資訊鏡像站
        </Chakra.Heading>
      </Chakra.Container>

      <Chakra.Container as="main" maxW="container.lg">
        <Chakra.Tabs isLazy>
          <Chakra.TabList>
            <Chakra.Tab>今日電力資訊</Chakra.Tab>
          </Chakra.TabList>
          <Chakra.TabPanels>
            <Chakra.TabPanel>
              <TodayData />
            </Chakra.TabPanel>
          </Chakra.TabPanels>
        </Chakra.Tabs>
      </Chakra.Container>

      <Chakra.Container as="footer" py={4} textAlign="right">
        <Chakra.Link
          isExternal
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
        >
          Powered by VERCEL
        </Chakra.Link>
        .{" "}
        <Chakra.Link isExternal href="https://github.com/tomchentw">
          Author: @tomchentw
        </Chakra.Link>
      </Chakra.Container>
    </React.Fragment>
  );
}
