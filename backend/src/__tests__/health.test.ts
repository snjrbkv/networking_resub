/**
 * Smoke tests that don't require a live database.
 * Validates the health endpoint and 404 handling.
 */
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("Infrastructure", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("unknown route returns 404 with a JSON error envelope", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("protected route without a token returns 401", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(401);
  });
});
