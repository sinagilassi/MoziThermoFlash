// import libs
import type { ModelSource } from "mozithermodb";

// ! LOCALS
import { VLE } from "@/docs";
import { modelSourceChecker } from "@/utils";

/**
 * VLE model for vapor-liquid equilibrium (VLE) calculations for
 * multi-component systems.
 *
 * @param components - List of component names.
 * @param modelSource - Model source parameters defined as an object.
 * @param kwargs - Additional parameters for the model.
 * @returns VLE model object.
 *
 * @remarks
 * The model source can be an object containing the following keys:
 * - `dataSource`: The data source for the model.
 * - `equationSource`: The equation source for the model.
 *
 * These two sources are generated with `PythermoDBLink`, please refer to the
 * documentation for more details.
 *
 * @example
 * ```typescript
 * // model source example
 * const modelSource = {
 *   dataSource: dataSource,
 *   equationSource: equationSource
 * };
 * ```
 */
export function vle(
    components: string[],
    modelSource?: ModelSource | null,
    ...kwargs: unknown[]
): VLE {
    try {
        // NOTE: check if components are valid
        if (
            !Array.isArray(components) ||
            !components.every((c) => typeof c === "string")
        ) {
            throw new Error("Components must be an array of strings.");
        }

        // NOTE: check if modelSource is valid
        if (modelSource !== null && modelSource !== undefined) {
            if (!modelSourceChecker(modelSource)) {
                throw new Error("Invalid model source.");
            }
        }

        // NOTE: init
        return new VLE(components, modelSource);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to create VLE model: ${error.message}`);
        }
        throw new Error("Failed to create VLE model: Unknown error");
    }
}
