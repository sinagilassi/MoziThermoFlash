import { describe, expect, it } from "vitest";
import type { ModelSource } from "mozithermodb";

import { VLE } from "../src/docs/vle";
import { modelSourceChecker } from "../src/utils/tools";

describe("modelSourceChecker", () => {
    it("accepts a valid camelCase model source", () => {
        const modelSource = {
            dataSource: {},
            equationSource: {},
        } as ModelSource;

        expect(modelSourceChecker(modelSource)).toBe(true);
    });

    it("rejects lowercase legacy keys", () => {
        const legacyModelSource = {
            datasource: {},
            equationsource: {},
        } as unknown as ModelSource;

        expect(() => modelSourceChecker(legacyModelSource)).toThrow(
            "Model source validation failed"
        );
    });

    it("rejects missing required keys", () => {
        const invalidModelSource = {} as ModelSource;
        expect(() => modelSourceChecker(invalidModelSource)).toThrow(
            "Model source validation failed"
        );
    });
});

describe("VLE model source contract", () => {
    it("constructs with null model source and returns empty camelCase getters", () => {
        const vle = new VLE(["water-l", "ethanol-l"], null);
        expect(vle.dataSource).toEqual({});
        expect(vle.equationSource).toEqual({});
    });

    it("constructs with valid model source and exposes camelCase getters", () => {
        const dataSource = { "water-l": { C1: 1 } };
        const equationSource = { "water-l": { VaPr: {} } };
        const modelSource = { dataSource, equationSource } as unknown as ModelSource;

        const vle = new VLE(["water-l", "ethanol-l"], modelSource);

        expect(vle.model_source).toBe(modelSource);
        expect(vle.dataSource).toBe(dataSource);
        expect(vle.equationSource).toBe(equationSource);
    });
});
