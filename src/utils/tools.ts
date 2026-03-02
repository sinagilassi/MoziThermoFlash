// import libs
import { ModelSource } from "mozithermodb";


/**
 * Check if the model source is valid.
 *
 * @param modelSource - Model source parameters as an object with
 * `datasource` and `equationsource` dictionary members.
 * @returns True if the model source is valid.
 */
export function modelSourceChecker(modelSource: ModelSource): boolean {
    try {
        if (
            typeof modelSource !== 'object' ||
            modelSource === null ||
            !('datasource' in modelSource) ||
            !('equationsource' in modelSource)
        ) {
            throw new Error("Model source must be an object with 'datasource' and 'equationsource' keys.");
        }

        const source = modelSource as {
            datasource: unknown;
            equationsource: unknown;
        };

        if (
            typeof source.datasource !== 'object' ||
            source.datasource === null ||
            typeof source.equationsource !== 'object' ||
            source.equationsource === null
        ) {
            throw new Error("'datasource' and 'equationsource' must be objects.");
        }

        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Model source validation failed: ${message}`);
    }
}

export const model_source_checker = modelSourceChecker;
