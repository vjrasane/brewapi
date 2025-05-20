import { Elysia, status, t } from "elysia";
import { Gauge, register } from "prom-client";

const { API_KEY } = process.env;

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

app.onBeforeHandle(async ({ query }) => {
  const { apiKey } = query;
  if (apiKey !== API_KEY) {
    return status(401);
  }
}).guard({
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
  temperature.set({ brew_name: body.name, unit: body.temp_unit }, body.temp);
  gravity.set({ brew_name: body.name }, body.gravity);

  return {
    status: "ok"
  }
})

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
