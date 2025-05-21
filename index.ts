import { Elysia, t } from "elysia";
import { Gauge, register } from "prom-client";
import { createDb, upsertLatestBrew } from "./sqlite";

const {
  API_KEY,
  SQLITE_DB = "/data/brewapi.sqlite",
  OG_RESET_TRESHOLD = 0.02,
  DEFAULT_OG,
} = process.env;

const db = createDb(SQLITE_DB);

const app = new Elysia()

const BrewData = t.Object({
  name: t.String(),
  temp: t.Number(),
  temp_unit: t.String(),
  gravity: t.Number(),
});

type BrewData = typeof BrewData.static;

const temperature = new Gauge({
  name: "brew_temperature",
  help: "Temperature of the brew",
  labelNames: ["brew_name", "unit"]
})

const gravity = new Gauge({
  name: "brew_gravity",
  help: "Specific gravity of the brew",
  labelNames: ["brew_name"]
})

const abv = new Gauge({
  name: "brew_abv",
  help: "Alcohol by volume of the brew",
  labelNames: ["brew_name", "unit"]
})

app.group("/api/v1", (app) =>
  app.post("/data", ({ request, body, headers }) => {
    console.log("----- REQUEST -----");
    console.log(new Date().toISOString());
    console.log(request.method)
    console.log("----- HEADERS -----");
    console.log(headers);
    console.log("----- BODY -----");
    console.log(body)
    console.log("----- END -----");

    const brew = upsertLatestBrew(db, body.name, body.gravity, +(DEFAULT_OG ?? body.gravity), +OG_RESET_TRESHOLD);

    temperature.set({ brew_name: body.name, unit: body.temp_unit }, body.temp);
    gravity.set({ brew_name: body.name }, body.gravity);
    abv.set({ brew_name: body.name, unit: "%" }, (brew.og - body.gravity) * 131.25);

    return {
      status: "ok"
    }
  }, {
    body: BrewData,
    beforeHandle: ({ set, query }) => {
      const { apiKey } = query;
      if (apiKey !== API_KEY) {
        return (set.status = 'Unauthorized')
      }
    }
  }))


app.get("/metrics", async () => {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { 'Content-Type': register.contentType },
  })
})

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
