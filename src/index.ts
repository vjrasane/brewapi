import { createApp } from "./app";
const {
  API_KEY,
  SQLITE_DB = "/data/brewapi.sqlite",
  OG_RESET_TRESHOLD,
  DEFAULT_OG,
} = process.env;

const app = createApp(
  SQLITE_DB,
  API_KEY ?? '',
  OG_RESET_TRESHOLD ? +OG_RESET_TRESHOLD : undefined,
  DEFAULT_OG ? +DEFAULT_OG : undefined
);

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
