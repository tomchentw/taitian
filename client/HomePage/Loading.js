import * as Chakra from "@chakra-ui/react";
import * as React from "react";

export default function Loading() {
  return (
    <Chakra.Center p={20}>
      <Chakra.Spinner size="xl" />
    </Chakra.Center>
  );
}
