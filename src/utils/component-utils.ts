// import libs
import { Component, ComponentKey } from "mozithermodb-settings";

/**
 * Set feed specification for a list of components with their mole fractions.
 *
 * @param components - List of Component objects, each with name, formula, state, and mole_fraction attributes.
 * @param componentKey - Key to use for feed specification. Options are 'Name-State', 'Formula-State', 'Name', 'Formula', 'Name-Formula-State' or 'Formula-Name-State'.
 * @returns Dictionary with component identifiers as keys and their mole fractions as values.
 * @throws Error if component_key is invalid or if setting feed specification fails.
 */
export function setFeedSpecification(
    components: Component[],
    componentKey: ComponentKey = 'Name-State'
): Record<string, number> {
    try {
        // NOTE: Initialize feed specification dictionary
        const feedSpec: Record<string, number> = {};

        // NOTE: Iterate over components to set feed specification
        for (let i = 0; i < components.length; i++) {
            const component = components[i];

            // set
            const name_ = component.name;
            const formula_ = component.formula;
            const state_ = component.state;

            // Check if mole_fraction is provided, otherwise skip
            if (component.mole_fraction == null) {
                console.warn(
                    `Component ${name_} does not have a mole fraction defined. Skipping.`
                );
                continue;
            }

            // std component key
            const normalizedKey = componentKey.trim().toLowerCase();

            // NOTE: Set feed specification
            if (normalizedKey === 'name-state') {
                feedSpec[`${name_}-${state_}`] = component.mole_fraction;
            } else if (normalizedKey === 'formula-state') {
                feedSpec[`${formula_}-${state_}`] = component.mole_fraction;
            } else if (normalizedKey === 'name') {
                feedSpec[name_] = component.mole_fraction;
            } else if (normalizedKey === 'formula') {
                feedSpec[formula_] = component.mole_fraction;
            } else if (normalizedKey === 'name-formula-state') {
                feedSpec[`${name_}-${formula_}-${state_}`] = component.mole_fraction;
            } else if (normalizedKey === 'formula-name-state') {
                feedSpec[`${formula_}-${name_}-${state_}`] = component.mole_fraction;
            } else {
                const errorMsg = `Invalid component_key: ${componentKey}. Use 'Name-State', 'Formula-State', 'Name', 'Formula', 'Name-Formula-State' or 'Formula-Name-State'.`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        return feedSpec;
    } catch (e) {
        const errorMsg = `Failed to set feed specification: ${e instanceof Error ? e.message : String(e)}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}
