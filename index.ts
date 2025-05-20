import { Elysia, status, t } from "elysia";

const { API_KEY, CACHE_MAX_AGE_SECONDS = 3600 * 24 } = process.env;

const app = new Elysia()

app.onBeforeHandle(async ({ query }) => {
  const { apiKey } = query;
  if (apiKey !== API_KEY) {
    return status(401);
  }
})


const BrewData = t.Object({
  name: t.String(),
  temp: t.Number(),
  temp_unit: t.String(),
  gravity: t.Number(),
});

type BrewData = typeof BrewData.static;

const BrewDataPoint = t.Intersect([BrewData, t.Object({
  time: t.Date(),
})])

type BrewDataPoint = typeof BrewDataPoint.static;

let cache: BrewDataPoint[] = []

app.guard({
  body: BrewData,
}).post("/api/v1/data", ({ request, body, headers }) => {
  console.log("----- REQUEST -----");
  console.log(new Date().toISOString());
  console.log(request.method)
  console.log("----- HEADERS -----");
  console.log(headers);
  console.log("----- BODY -----");
  console.log(body)
  console.log("----- END -----");

  const now = new Date();
  const data = {
    ...body,
    time: now,
  }

  cache = [...cache, data].filter((item) => {
    const diff = (item.time.getTime() - now.getTime()) / 1000;
    return diff < +CACHE_MAX_AGE_SECONDS;
  })
})

app.guard({
  response: t.Array(BrewDataPoint),
}).get("/api/v1/data", () => {
  return cache
})

app.guard({
  response: t.Union([BrewDataPoint, t.Null()])
}).get("/api/v1/data/last", () => {
  return cache[cache.length - 1] ?? null
})

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
