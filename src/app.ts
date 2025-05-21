import Elysia, { status, t } from "elysia";
import { register } from "prom-client";
import { abv, gravity, temperature } from "./gauges";
import { createDb, upsertLatestBrew } from "./sqlite";

const BrewData = t.Object({
    name: t.String(),
    temp: t.Number(),
    temp_unit: t.String(),
    gravity: t.Number(),
});

type BrewData = typeof BrewData.static;

export function createApp(dbPath: string, apiKey: string, ogResetTreshhold: number = 0.02, defaultOg?: number) {
    const DbService = new Elysia({ name: "Service.Db" })
        .state('db', createDb(dbPath))

    const ApiKeyService = new Elysia({ name: "Service.ApiKey" })
        .onBeforeHandle(
            ({ query }) => {
                if (query.apiKey !== apiKey) {
                    return status(401)
                }
            }
        )

    const ApiController = new Elysia({ name: "Controller.Api" })
        .use(ApiKeyService)
        .use(DbService)
        .group("/api/v1", (app) =>
            app.post("/data", ({ request, body, headers, store }) => {
                console.log("----- REQUEST -----");
                console.log(new Date().toISOString());
                console.log(request.method)
                console.log("----- HEADERS -----");
                console.log(headers);
                console.log("----- BODY -----");
                console.log(body)
                console.log("----- END -----");

                const { db } = store;

                const brew = upsertLatestBrew(db, body.name, body.gravity, defaultOg ?? body.gravity, ogResetTreshhold);

                temperature.set({ brew_name: body.name, unit: body.temp_unit }, body.temp);
                gravity.set({ brew_name: body.name }, body.gravity);
                abv.set({ brew_name: body.name, unit: "%" }, (brew.og - body.gravity) * 131.25);

                return brew
            }, {
                body: BrewData,
                beforeHandle: ({ set, query }) => {
                    if (query.apiKey !== apiKey) {
                        return (set.status = 'Unauthorized')
                    }
                }
            }))

    const MetricsController = new Elysia({ name: "Controller.Metrics" })
        .get("/metrics", async ({ request }) => {
            const metrics = await register.metrics();
            return new Response(metrics, {
                headers: { 'Content-Type': register.contentType },
            })
        })

    const app = new Elysia()
        .use(ApiController)
        .use(MetricsController)

    return app
}

export type App = ReturnType<typeof createApp>