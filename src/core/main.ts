import {
    type Component,
    type Temperature,
    type Pressure,
    type ComponentKey,
    set_component_id,
} from "mozithermodb-settings";
import { type ModelSource } from "mozithermodb";

import { VLE } from "../docs";
import {
    type BubblePressureResult,
    type DewPressureResult,
    type BubbleTemperatureResult,
    type DewTemperatureResult,
    type FlashIsothermalResult,
    type CheckFlashIsothermalResult,
} from "../types";
import {
    setFeedSpecification,
    prepareBubblePressureResultStructure,
    prepareDewPressureResultStructure,
    prepareBubbleTemperatureResultStructure,
    prepareDewTemperatureResultStructure,
    prepareFlashIsothermalResultStructure,
    prepareCheckFlashIsothermalResultStructure,
} from "../utils";

type ModelType = "bpp" | "dpp" | "bpt" | "dpt" | "if" | "cif";

type InputGeneratorResult = {
    component_names: string[];
    component_ids: string[];
    vle_model: VLE;
    inputs: Record<string, any>;
};

function _input_generator(
    model_type: ModelType,
    components: Component[],
    model_source: ModelSource,
    temperature: Temperature | null = null,
    pressure: Pressure | null = null,
    component_key: ComponentKey = "Name-State",
    component_delimiter = "-"
): InputGeneratorResult {
    if (!Array.isArray(components) || components.length === 0) {
        throw new Error("Invalid component input. Must be a non-empty list of Component.");
    }

    const component_ids = components.map((component) =>
        set_component_id(component, component_key)
    );
    const component_names = component_ids.map((id) => {
        const index = id.lastIndexOf(component_delimiter);
        return index >= 0 ? id.slice(0, index) : id;
    });

    const feed_spec = setFeedSpecification(components, component_key);
    const inputs: Record<string, any> = { mole_fraction: feed_spec };

    if (model_type === "bpp" || model_type === "dpp" || model_type === "if" || model_type === "cif") {
        if (!temperature) {
            throw new Error("Temperature input is required.");
        }
        inputs.temperature = [temperature.value, temperature.unit];
    }

    if (model_type === "bpt" || model_type === "dpt" || model_type === "if" || model_type === "cif") {
        if (!pressure) {
            throw new Error("Pressure input is required.");
        }
        inputs.pressure = [pressure.value, pressure.unit];
    }

    const vle_model = new VLE(component_ids, {
        dataSource: model_source.dataSource,
        equationSource: model_source.equationSource,
    });

    return {
        component_names,
        component_ids,
        vle_model,
        inputs,
    };
}

export function calc_bubble_point_pressure(
    components: Component[],
    temperature: Temperature,
    model_source: ModelSource,
    equilibrium_model: "raoult" | "modified-raoult" = "raoult",
    fugacity_model: "vdW" | "PR" | "RK" | "SRK" | null = null,
    activity_model: "NRTL" | "UNIQUAC" | null = null,
    component_key: ComponentKey = "Name-State",
    message: string | null = null,
    kwargs: Record<string, any> = {}
): BubblePressureResult | null {
    try {
        const input_dict = _input_generator(
            "bpp",
            components,
            model_source,
            temperature,
            null,
            component_key
        );

        const data = input_dict.vle_model.bubble_pressure(
            input_dict.inputs,
            equilibrium_model,
            fugacity_model,
            activity_model,
            message,
            kwargs
        );

        return prepareBubblePressureResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in calc_bubble_point_pressure: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export function calc_dew_point_pressure(
    components: Component[],
    temperature: Temperature,
    model_source: ModelSource,
    equilibrium_model: "raoult" | "modified-raoult" = "raoult",
    fugacity_model: "vdW" | "PR" | "RK" | "SRK" | null = null,
    activity_model: "NRTL" | "UNIQUAC" | null = null,
    component_key: ComponentKey = "Name-State",
    message: string | null = null,
    kwargs: Record<string, any> = {}
): DewPressureResult | null {
    try {
        const input_dict = _input_generator(
            "dpp",
            components,
            model_source,
            temperature,
            null,
            component_key
        );

        const data = input_dict.vle_model.dew_pressure(
            input_dict.inputs,
            equilibrium_model,
            fugacity_model,
            activity_model,
            message,
            kwargs
        );

        return prepareDewPressureResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in calc_dew_point_pressure: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export function calc_bubble_point_temperature(
    components: Component[],
    pressure: Pressure,
    model_source: ModelSource,
    equilibrium_model: "raoult" | "modified-raoult" = "raoult",
    fugacity_model: "vdW" | "PR" | "RK" | "SRK" = "SRK",
    activity_model: "NRTL" | "UNIQUAC" = "NRTL",
    component_key: ComponentKey = "Name-State",
    solver_method: "root" | "least-squares" | "fsolve" = "root",
    message: string | null = null,
    kwargs: Record<string, any> = {}
): BubbleTemperatureResult | null {
    try {
        const input_dict = _input_generator(
            "bpt",
            components,
            model_source,
            null,
            pressure,
            component_key
        );

        const data = input_dict.vle_model.bubble_temperature(
            input_dict.inputs,
            equilibrium_model,
            fugacity_model,
            activity_model,
            solver_method,
            message,
            kwargs
        );

        return prepareBubbleTemperatureResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in calc_bubble_point_temperature: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export function calc_dew_point_temperature(
    components: Component[],
    pressure: Pressure,
    model_source: ModelSource,
    equilibrium_model: "raoult" | "modified-raoult" = "raoult",
    fugacity_model: "vdW" | "PR" | "RK" | "SRK" = "SRK",
    activity_model: "NRTL" | "UNIQUAC" = "NRTL",
    component_key: ComponentKey = "Name-State",
    solver_method: "root" | "least-squares" | "fsolve" = "root",
    message: string | null = null,
    kwargs: Record<string, any> = {}
): DewTemperatureResult | null {
    try {
        const input_dict = _input_generator(
            "dpt",
            components,
            model_source,
            null,
            pressure,
            component_key
        );

        const data = input_dict.vle_model.dew_temperature(
            input_dict.inputs,
            equilibrium_model,
            fugacity_model,
            activity_model,
            solver_method,
            message,
            kwargs
        );

        return prepareDewTemperatureResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in calc_dew_point_temperature: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export function calc_isothermal_flash(
    components: Component[],
    temperature: Temperature,
    pressure: Pressure,
    model_source: ModelSource,
    equilibrium_model: "raoult" | "modified-raoult" = "raoult",
    fugacity_model: "vdW" | "PR" | "RK" | "SRK" = "SRK",
    activity_model: "NRTL" | "UNIQUAC" = "NRTL",
    component_key: ComponentKey = "Name-State",
    solver_method: "least_squares" | "minimize" = "least_squares",
    flash_checker = false,
    message: string | null = null,
    kwargs: Record<string, any> = {}
): FlashIsothermalResult | null {
    try {
        const input_dict = _input_generator(
            "if",
            components,
            model_source,
            temperature,
            pressure,
            component_key
        );

        const data = input_dict.vle_model.flash_isothermal(
            input_dict.inputs,
            equilibrium_model,
            fugacity_model,
            activity_model,
            solver_method,
            flash_checker,
            message,
            kwargs
        );

        return prepareFlashIsothermalResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in calc_isothermal_flash: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export function is_flashable(
    components: Component[],
    temperature: Temperature,
    pressure: Pressure,
    model_source: ModelSource,
    component_key: ComponentKey = "Name-State",
    message: string | null = null
): CheckFlashIsothermalResult | null {
    try {
        const input_dict = _input_generator(
            "cif",
            components,
            model_source,
            temperature,
            pressure,
            component_key
        );

        const data = input_dict.vle_model.is_flashable(
            input_dict.inputs,
            "raoult",
            message
        );

        return prepareCheckFlashIsothermalResultStructure(
            input_dict.component_names,
            components,
            data
        );
    } catch (error) {
        console.error(`Error in is_flashable: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export {
    _input_generator,
};
