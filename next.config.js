"use strict";

module.exports = {
  /**
   * Set basePath, assetPrefix for GitHub pages.
   * taitian: tâi-tiān
   * basePath: "/taitian",
   * assetPrefix: "/taitian/",
   *
   * @see https://itaigi.tw/k/%E5%8F%B0%E9%9B%BB/
   */
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      "/": { page: "/" },
    };
  },
};
