import { treaty } from "@elysiajs/eden";
import { beforeEach, expect, test } from "bun:test";
import { App, createApp } from "../src/app";
import { Brew } from "../src/sqlite";

let app: App;
let apiKey: string;

beforeEach(() => {
    Bun.env.API_KEY = apiKey = Bun.randomUUIDv7();

    app = createApp(":memory:", apiKey);
})

test("POST data inserts new brew in DB", async () => {
    const api = treaty(app);

    const { db } = app.store
    const { data, error } = await api.api.v1.data.post({
        name: "TestBrew",
        temp: 20,
        temp_unit: "C",
        gravity: 1.060,
    }, { query: { apiKey } });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data).toEqual({
        brew_id: expect.any(Number),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        brew_name: "TestBrew",
        og: 1.060,
        sg: 1.060,
    });

    const row = db.query<Brew, number>(`SELECT * FROM brew WHERE brew_id = ?`).get(data!.brew_id);
    expect(row).toBeDefined();
    expect(row?.brew_name).toBe("TestBrew");
    expect(row?.og).toBe(1.060);
    expect(row?.sg).toBe(1.060);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(1);
});

test("POST data with invalid api key unauthorized", async () => {
    const api = treaty(app);

    const { db } = app.store
    const { data, error } = await api.api.v1.data.post({
        name: "TestBrew",
        temp: 20,
        temp_unit: "C",
        gravity: 1.060,
    }, { query: { apiKey: "invalid" } });

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.status).toBe(401 as any);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(0);
});

test("POST data with invalid data unprocessable", async () => {
    const api = treaty(app);

    const { db } = app.store
    const { data, error } = await api.api.v1.data.post({
        invalid: "data"
    } as any, { query: { apiKey } });

    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.status).toBe(422 as any);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(0);
});

test("GET metrics returns prometheus metrics", async () => {
    const api = treaty(app);

    const { data, error } = await api.metrics.get();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data).toContain("brew_abv");
    expect(data).toContain("brew_gravity");
    expect(data).toContain("brew_temperature");
})