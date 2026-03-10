import { describe, expect, it } from "vitest";

import { solveRachfordRice } from "../src/solvers/rachford-rice";

function rrResidual(beta: number, z: number[], k: number[]): number {
    return z.reduce((acc, zi, i) => {
        const denominator = 1 + beta * (k[i] - 1);
        return acc + (zi * (k[i] - 1)) / denominator;
    }, 0);
}

describe("solveRachfordRice", () => {
    it("classifies all K < 1 as liquid-only", () => {
        const res = solveRachfordRice([0.4, 0.6], [0.2, 0.8]);
        expect(res.phase).toBe("L");
        expect(res.beta).toBe(0);
        expect(res.converged).toBe(true);
    });

    it("classifies all K > 1 as vapor-only", () => {
        const res = solveRachfordRice([0.4, 0.6], [1.2, 1.8]);
        expect(res.phase).toBe("V");
        expect(res.beta).toBe(1);
        expect(res.converged).toBe(true);
    });

    it("solves mixed K-values as two-phase with bounded beta", () => {
        const z = [0.5, 0.5];
        const k = [0.4, 2.2];
        const res = solveRachfordRice(z, k, { tolerance: 1e-12, maxIter: 300 });

        expect(res.phase).toBe("VL");
        expect(res.beta).toBeGreaterThan(0);
        expect(res.beta).toBeLessThan(1);
        expect(Math.abs(rrResidual(res.beta, z, k))).toBeLessThan(1e-9);
        expect(res.converged).toBe(true);
    });
});
