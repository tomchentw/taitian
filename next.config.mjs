export default {
  basePath: "/taipower", // GitHub pages
  assetPrefix: "/taipower/",
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      "/": { page: "/" },
    };
  },
};
