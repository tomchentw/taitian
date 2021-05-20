import path from "path";
import { fileURLToPath } from "url";
import bunyan from "bunyan";

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const ERROR_PATH = path.join(DIRNAME, `../public/data/log/error.log`);

export default bunyan.createLogger({
  name: "taitian",
  streams: [
    {
      level: "info",
      stream: process.stdout,
    },
    {
      level: "error",
      stream: process.stderr,
    },
    process.env.CI && {
      level: "error",
      path: ERROR_PATH,
    },
  ].filter(Boolean),
});
