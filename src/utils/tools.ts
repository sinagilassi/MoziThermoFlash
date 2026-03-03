// import libs
import { ModelSource } from "mozithermodb";


/**
 * Check if the model source is valid.
 *
 * @param modelSource - Model source parameters as an object with
 * `dataSource` and `equationSource` dictionary members.
 * @returns True if the model source is valid.
 */
export function modelSourceChecker(modelSource: ModelSource): boolean {
    try {
        if (
            typeof modelSource !== 'object' ||
            modelSource === null ||
            !('dataSource' in modelSource) ||
            !('equationSource' in modelSource)
        ) {
            throw new Error("Model source must be an object with 'dataSource' and 'equationSource' keys.");
        }

        const source = modelSource as {
            dataSource: unknown;
            equationSource: unknown;
        };

        if (
            typeof source.dataSource !== 'object' ||
            source.dataSource === null ||
            typeof source.equationSource !== 'object' ||
            source.equationSource === null
        ) {
            throw new Error("'dataSource' and 'equationSource' must be objects.");
        }

        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Model source validation failed: ${message}`);
    }
}

export const model_source_checker = modelSourceChecker;
