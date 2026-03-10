import { describe, expect, it } from "vitest";

import { VLE } from "../src/docs/vle";
import { createActivityFactory } from "../examples/binary mixture/activity-factory";
import { model_source_ as modelSource } from "../examples/model-source-3";

const components = ["water-l", "ethanol-l"];
const vle = new VLE(components, modelSource);

const activityInputs = {
    alpha: [[0, 0.3], [0.3, 0]],
    a_ij: [[0.0, 3.458], [-0.801, 0.0]],
    b_ij: [[0.0, -586.1], [246.2, 0.0]],
    c_ij: [[0.0, 0.0], [0.0, 0.0]],
    d_ij: [[0.0, 0.0], [0.0, 0.0]],
};

function sum(values: number[]): number {
    return values.reduce((acc, value) => acc + value, 0);
}

describe("flash_isothermal regression", () => {
    it("returns physically consistent single-phase liquid result", () => {
        const inputs = {
            mole_fraction: { "water-l": 0.5, "ethanol-l": 0.5 },
            temperature: [30, "C"] as [number, string],
            pressure: [7, "kPa"] as [number, string],
        };

        const res = vle.flash_isothermal(inputs, "raoult", null, null, "least_squares");
        const x = res.liquid_mole_fraction as number[];
        const y = res.vapor_mole_fraction as number[];
        const z = res.feed_mole_fraction as number[];

        expect(res.phase).toBe("L");
        expect(res.V_F_ratio.value).toBe(0);
        expect(sum(x)).toBeCloseTo(1, 12);
        expect(sum(y)).toBeCloseTo(1, 12);
        expect(x[0]).toBeCloseTo(z[0], 12);
        expect(x[1]).toBeCloseTo(z[1], 12);
        expect(y[0]).toBeCloseTo(z[0], 12);
        expect(y[1]).toBeCloseTo(z[1], 12);
    });

    it("returns a two-phase split with component material-balance closure", () => {
        const inputs = {
            mole_fraction: { "water-l": 0.5, "ethanol-l": 0.5 },
            temperature: [30, "C"] as [number, string],
            pressure: [3, "kPa"] as [number, string],
        };

        const res = vle.flash_isothermal(inputs, "raoult", null, null, "least_squares");
        const beta = Number(res.V_F_ratio.value);
        const x = res.liquid_mole_fraction as number[];
        const y = res.vapor_mole_fraction as number[];
        const z = res.feed_mole_fraction as number[];

        expect(res.phase).toBe("VL");
        expect(beta).toBeGreaterThan(0);
        expect(beta).toBeLessThan(1);
        expect(sum(x)).toBeCloseTo(1, 10);
        expect(sum(y)).toBeCloseTo(1, 10);
        expect((1 - beta) * x[0] + beta * y[0]).toBeCloseTo(z[0], 8);
        expect((1 - beta) * x[1] + beta * y[1]).toBeCloseTo(z[1], 8);
    });

    it("keeps modified-raoult flash normalized and converged", () => {
        const inputs = {
            mole_fraction: { "water-l": 0.5, "ethanol-l": 0.5 },
            temperature: [30, "C"] as [number, string],
            pressure: [3, "kPa"] as [number, string],
        };

        const res = vle.flash_isothermal(
            inputs,
            "modified-raoult",
            null,
            "NRTL",
            "least_squares",
            false,
            null,
            {
                max_iter: 500,
                tolerance: 1e-9,
                activity_inputs: activityInputs,
                activityFactory: createActivityFactory(),
            }
        );

        const x = res.liquid_mole_fraction as number[];
        const y = res.vapor_mole_fraction as number[];
        expect(res.phase).toBe("VL");
        expect(res.converged).toBe(true);
        expect(sum(x)).toBeCloseTo(1, 10);
        expect(sum(y)).toBeCloseTo(1, 10);
    });
});
