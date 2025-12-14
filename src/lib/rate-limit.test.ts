import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("autorise les premières requêtes dans la fenêtre", () => {
    const key = `test-${Date.now()}`;
    const oneMinute = 60_000;

    const r1 = rateLimit(key, 3, oneMinute);
    const r2 = rateLimit(key, 3, oneMinute);
    const r3 = rateLimit(key, 3, oneMinute);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("bloque après le nombre maximal de requêtes", () => {
    const key = `test-block-${Date.now()}`;
    const oneMinute = 60_000;

    rateLimit(key, 1, oneMinute);
    const second = rateLimit(key, 1, oneMinute);

    expect(second.allowed).toBe(false);
    expect(typeof second.retryAfterSeconds).toBe("number");
  });
});















































