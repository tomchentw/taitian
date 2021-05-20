import * as Chakra from "@chakra-ui/react";
import * as React from "react";
import TodayData from "./TodayData";

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
