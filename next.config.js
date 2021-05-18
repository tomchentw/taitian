"use strict";

module.exports = {
  /**
   * Set basePath, assetPrefix for GitHub pages.
   * taitian: tâi-tiān
   *
   * @see https://itaigi.tw/k/%E5%8F%B0%E9%9B%BB/
   */
  basePath: "/taitian",
  assetPrefix: "/taitian/",
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      "/": { page: "/" },
    };
  },
};
