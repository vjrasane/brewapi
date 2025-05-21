import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { createDb, upsertLatestBrew } from "../sqlite";

let db: Database;

beforeEach(() => {
    db = createDb(":memory:");
});

test("inserts one brew with correct OG on first insert", () => {
    const brewName = "TestBrew";
    const og = 1.060;
    const brew = upsertLatestBrew(db, brewName, og);

    expect(brew.og).toBe(og);

    const row = db.query<{
        og: number, sg: number
    }, number>(`SELECT * FROM brew WHERE brew_id = ?`).get(brew.brew_id);
    expect(row).toBeDefined();
    expect(row?.og).toBe(og);
    expect(row?.sg).toBe(og);
});

test("updates SG without inserting a new brew if gravity drops", () => {
    const brewName = "TestBrew";
    const og = 1.060;
    const sg = 1.055;

    const original = upsertLatestBrew(db, brewName, og);

    const brew = upsertLatestBrew(db, brewName, sg);
    expect(brew.og).toBe(og);
    expect(brew.sg).toBe(sg);

    expect(original.brew_id).toBe(brew.brew_id);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(1);

    const row = db.query<{
        og: number, sg: number
    }, number>(`SELECT * FROM brew WHERE brew_id = ?`).get(brew.brew_id);
    expect(row?.sg).toBe(sg);
    expect(row?.og).toBe(og);
});
test("updates SG without inserting a new brew if gravity raises within threshold", () => {
    const threshold = 0.02;
    const brewName = "TestBrew";
    const og = 1.060;
    const sg = og + threshold - 0.01;

    const original = upsertLatestBrew(db, brewName, og);

    const brew = upsertLatestBrew(db, brewName, sg);
    expect(brew.og).toBe(og);
    expect(brew.sg).toBe(sg);

    expect(original.brew_id).toBe(brew.brew_id);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(1);

    const row = db.query<{
        og: number, sg: number
    }, number>(`SELECT * FROM brew WHERE brew_id = ?`).get(brew.brew_id);
    expect(row?.sg).toBe(sg);
    expect(row?.og).toBe(og);
});

test("inserts new brew if gravity raises outside of threshold", () => {
    const threshold = 0.02;
    const brewName = "TestBrew";
    const og = 1.060;
    const sg = og + threshold;

    const original = upsertLatestBrew(db, brewName, og);

    const brew = upsertLatestBrew(db, brewName, sg);
    expect(brew.og).toBe(sg);
    expect(brew.sg).toBe(sg);

    expect(original.brew_id).not.toBe(brew.brew_id);

    const result = db.query<{ count: number }, null>(`SELECT COUNT(*) as count FROM brew`).get(null);
    expect(result?.count).toBe(2);

    const row = db.query<{
        og: number, sg: number
    }, number>(`SELECT * FROM brew WHERE brew_id = ?`).get(brew.brew_id);
    expect(row?.sg).toBe(sg);
    expect(row?.og).toBe(sg);
});