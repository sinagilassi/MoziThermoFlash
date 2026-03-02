//  import libs
import { Component, Temperature, Pressure, ComponentKey } from "mozithermodb-settings";
import {
    BubblePressureResult,
    DewPressureResult,
    BubbleTemperatureResult,
    DewTemperatureResult,
    ComponentProps,
    Quantity,
    FlashIsothermalResult,
    CheckFlashIsothermalResult
} from "../types/flash";

type ModelType = 'BP' | 'DP' | 'BT' | 'DT' | 'IF' | 'CIF';

function _preparePressureResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
    modelType: ModelType,
): BubblePressureResult | DewPressureResult | BubbleTemperatureResult | DewTemperatureResult | FlashIsothermalResult | CheckFlashIsothermalResult | null {
    /**
     * Prepare result structure for output.
     */
    try {
        // SECTION: parse result
        // NOTE: temperature
        const temperature_ = data['temperature'] ?? null;
        let temperature: Temperature;
        if (temperature_ !== null) {
            temperature = {
                value: parseFloat(temperature_['value']),
                unit: temperature_['unit']
            } as Temperature;
        } else {
            temperature = {
                value: 0.0,
                unit: 'K'
            } as Temperature;
        }

        // NOTE: pressure
        const pressure_ = data['pressure'] ?? null;
        let pressure: Pressure;
        if (pressure_ !== null) {
            pressure = {
                value: parseFloat(pressure_['value']),
                unit: pressure_['unit']
            } as Pressure;
        } else {
            pressure = {
                value: 0.0,
                unit: 'Pa'
            } as Pressure;
        }

        // NOTE: pressure calc result
        const calcPressure = data['bubble_pressure'] ?? data['dew_pressure'] ?? null;
        let resultPressure: Pressure;
        if (calcPressure !== null) {
            resultPressure = {
                value: parseFloat(calcPressure['value']),
                unit: calcPressure['unit']
            } as Pressure;
        } else {
            resultPressure = {
                value: 0.0,
                unit: 'Pa'
            } as Pressure;
        }

        // NOTE: temperature calc result
        const calcTemperature = data['bubble_temperature'] ?? data['dew_temperature'] ?? null;
        let resultTemperature: Temperature;
        if (calcTemperature !== null) {
            resultTemperature = {
                value: parseFloat(calcTemperature['value']),
                unit: calcTemperature['unit']
            } as Temperature;
        } else {
            resultTemperature = {
                value: 0.0,
                unit: 'K'
            } as Temperature;
        }

        // NOTE: component ids
        const componentIds: string[] = data['components'] ?? [];

        // NOTE: mole fractions
        const feedMoleFraction_ = data['feed_mole_fraction'] ?? [];
        const vaporMoleFraction_ = data['vapor_mole_fraction'] ?? [];
        const liquidMoleFraction_ = data['liquid_mole_fraction'] ?? [];
        const moleFractionSum = data['mole_fraction_sum'] ?? [];

        // NOTE: activity coefficients, K ratios, vapor pressures
        const activityCoefficients = data['activity_coefficient'] ?? null;
        const kRatios = data['K_ratio'] ?? null;
        const vaporPressures = data['vapor_pressure'] ?? null;

        // NOTE: message
        const message = data['message'] ?? 'Not specified.';

        // NOTE: models
        const equilibriumModel = data['equilibrium_model'] ?? null;
        const fugacityModel = data['fugacity_model'] ?? null;
        const activityModel = data['activity_model'] ?? null;

        // NOTE: computation time
        let computationTime: Quantity<number> | null = null;
        const computationTime_ = data['computation_time'] ?? null;
        // >> check
        if (computationTime_ !== null) {
            computationTime = {
                value: parseFloat(computationTime_['value']),
                unit: computationTime_['unit'],
                symbol: 't'
            };
        }

        // NOTE: solver method
        const solverMethod = data['solver_method'] ?? null;

        // SECTION: feed
        const feedMoleFraction: Component[] = [];
        const vaporMoleFraction: Component[] = [];
        const liquidMoleFraction: Component[] = [];

        // iterate components
        for (let i = 0; i < componentNames.length; i++) {
            const compName = componentNames[i];

            // feed mole fraction
            const moleFracValue = i < feedMoleFraction_.length ? feedMoleFraction_[i] : null;
            // vapor mole fraction
            const vaporMoleFracValue = i < vaporMoleFraction_.length ? vaporMoleFraction_[i] : null;
            // liquid mole fraction
            const liquidMoleFracValue = i < liquidMoleFraction_.length ? liquidMoleFraction_[i] : null;

            const comp = components.find(c => c.name === compName) ?? null;

            // NOTE: feed mole fraction
            if (comp !== null && moleFracValue !== null) {
                // >> append
                feedMoleFraction.push({
                    name: comp.name,
                    formula: comp.formula,
                    state: comp.state,
                    mole_fraction: parseFloat(moleFracValue)
                } as Component);
            }

            // NOTE: vapor mole fraction
            if (comp !== null && vaporMoleFracValue !== null) {
                // >> append
                vaporMoleFraction.push({
                    name: comp.name,
                    formula: comp.formula,
                    state: comp.state,
                    mole_fraction: parseFloat(vaporMoleFracValue)
                } as Component);
            }

            // NOTE: liquid mole fraction
            if (comp !== null && liquidMoleFracValue !== null) {
                // >> append
                liquidMoleFraction.push({
                    name: comp.name,
                    formula: comp.formula,
                    state: comp.state,
                    mole_fraction: parseFloat(liquidMoleFracValue)
                } as Component);
            }
        }

        // NOTE: calculation setup
        const maxIter = data['max_iter'] ?? null;
        const tolerance = data['tolerance'] ?? null;
        const iteration = data['iteration'] ?? null;

        // NOTE: flash properties
        let vfRatio: Quantity<number>;
        const vfRatio_ = data['V_F_ratio'] ?? null;
        // >> check
        if (vfRatio_ !== null) {
            vfRatio = {
                value: parseFloat(vfRatio_['value']),
                unit: vfRatio_['unit'],
                symbol: vfRatio_['symbol']
            };
        } else {
            vfRatio = {
                value: 0.0,
                unit: '-',
                symbol: 'V/F'
            };
        }

        let lfRatio: Quantity<number>;
        const lfRatio_ = data['L_F_ratio'] ?? null;
        // >> check
        if (lfRatio_ !== null) {
            lfRatio = {
                value: parseFloat(lfRatio_['value']),
                unit: lfRatio_['unit'],
                symbol: lfRatio_['symbol']
            };
        } else {
            lfRatio = {
                value: 0.0,
                unit: '-',
                symbol: 'L/F'
            };
        }

        const solverMessage = data['solver_message'] ?? null;
        const flashChecker = data['flash_checker'] ?? null;
        const flashCheckerRes = data['flash_checker_res'] ?? null;

        // SECTION: component properties
        const componentProps: ComponentProps[] = [];

        for (let i = 0; i < componentNames.length; i++) {
            const compName = componentNames[i];

            // find component
            const component = components.find(comp => comp.name === compName) ?? null;

            // >> check
            if (component === null) {
                console.warn(
                    `Component '${compName}' not found in components list.`
                );
                continue;
            }

            const compProp: ComponentProps = {
                component: component,
                properties: {}
            };

            // >> vapor pressure
            if (vaporPressures !== null) {
                const vpValue = vaporPressures['value'][i];
                const vpUnit = vaporPressures['unit'];
                compProp.properties['vapor_pressure'] = {
                    value: parseFloat(vpValue),
                    unit: vpUnit,
                    symbol: 'VaPr'
                };
            }

            // >> activity coefficient
            if (activityCoefficients !== null) {
                const acValue = activityCoefficients['value'][i];
                const acUnit = activityCoefficients['unit'];
                compProp.properties['activity_coefficient'] = {
                    value: parseFloat(acValue),
                    unit: acUnit,
                    symbol: 'AcCo'
                };
            }

            // >> K ratio
            if (kRatios !== null) {
                const kValue = kRatios['value'][i];
                const kUnit = kRatios['unit'];
                compProp.properties['K_ratio'] = {
                    value: parseFloat(kValue),
                    unit: kUnit,
                    symbol: 'Kxy'
                };
            }

            // NOTE: append other properties as needed
            componentProps.push(compProp);
        }

        // SECTION: init result
        let resultStructure: BubblePressureResult | DewPressureResult | BubbleTemperatureResult | DewTemperatureResult | FlashIsothermalResult | CheckFlashIsothermalResult | null;

        if (modelType === 'BP') {
            //! Bubble Pressure Result
            resultStructure = {
                bubble_pressure: resultPressure,
                temperature: temperature,
                component_ids: componentIds,
                feed_mole_fraction: feedMoleFraction,
                vapor_mole_fraction: vaporMoleFraction,
                liquid_mole_fraction: liquidMoleFraction,
                mole_fraction_sum: moleFractionSum,
                component_props: componentProps,
                message: message,
                equilibrium_model: equilibriumModel,
                fugacity_model: fugacityModel,
                activity_model: activityModel,
                computation_time: computationTime
            } as BubblePressureResult;
        } else if (modelType === 'DP') {
            //! Dew Pressure Result
            resultStructure = {
                dew_pressure: resultPressure,
                temperature: temperature,
                component_ids: componentIds,
                feed_mole_fraction: feedMoleFraction,
                vapor_mole_fraction: vaporMoleFraction,
                liquid_mole_fraction: liquidMoleFraction,
                mole_fraction_sum: moleFractionSum,
                component_props: componentProps,
                message: message,
                equilibrium_model: equilibriumModel,
                fugacity_model: fugacityModel,
                activity_model: activityModel,
                computation_time: computationTime,
                max_iter: maxIter,
                tolerance: tolerance,
                iteration: iteration
            } as DewPressureResult;
        } else if (modelType === 'BT') {
            //! Bubble Temperature Result
            resultStructure = {
                bubble_temperature: resultTemperature,
                pressure: pressure,
                component_ids: componentIds,
                feed_mole_fraction: feedMoleFraction,
                vapor_mole_fraction: vaporMoleFraction,
                liquid_mole_fraction: liquidMoleFraction,
                mole_fraction_sum: moleFractionSum,
                component_props: componentProps,
                message: message,
                equilibrium_model: equilibriumModel,
                fugacity_model: fugacityModel,
                activity_model: activityModel,
                solver_method: solverMethod,
                computation_time: computationTime
            } as BubbleTemperatureResult;
        } else if (modelType === 'DT') {
            //! Dew Temperature Result
            resultStructure = {
                dew_temperature: resultTemperature,
                pressure: pressure,
                component_ids: componentIds,
                feed_mole_fraction: feedMoleFraction,
                vapor_mole_fraction: vaporMoleFraction,
                liquid_mole_fraction: liquidMoleFraction,
                mole_fraction_sum: moleFractionSum,
                component_props: componentProps,
                message: message,
                equilibrium_model: equilibriumModel,
                fugacity_model: fugacityModel,
                activity_model: activityModel,
                solver_method: solverMethod,
                computation_time: computationTime
            } as DewTemperatureResult;
        } else if (modelType === 'IF') {
            //! Flash Isothermal Result
            resultStructure = {
                V_F_ratio: vfRatio,
                L_F_ratio: lfRatio,
                temperature: temperature,
                pressure: pressure,
                component_ids: componentIds,
                feed_mole_fraction: feedMoleFraction,
                vapor_mole_fraction: vaporMoleFraction,
                liquid_mole_fraction: liquidMoleFraction,
                mole_fraction_sum: moleFractionSum,
                component_props: componentProps,
                equilibrium_model: equilibriumModel,
                fugacity_model: fugacityModel,
                activity_model: activityModel,
                flash_checker: flashChecker,
                flash_checker_res: flashCheckerRes,
                solver_method: solverMethod,
                solver_message: solverMessage,
                message: message,
                computation_time: computationTime,
            } as FlashIsothermalResult;
        } else if (modelType === 'CIF') {
            //! Check Flash Isothermal Result
            resultStructure = {
                pressure: pressure,
                temperature: temperature,
                component_ids: componentIds,
                components: components,
                feed_mole_fraction: feedMoleFraction,
                equilibrium_model: equilibriumModel,
                flash_checker_res: flashCheckerRes,
                message: message,
                computation_time: computationTime,
            } as CheckFlashIsothermalResult;
        } else {
            resultStructure = null;
        }

        return resultStructure;
    } catch (e) {
        const errorMsg = `Error preparing result structure: ${e instanceof Error ? e.message : String(e)}`;
        console.error(errorMsg);
        throw e;
    }
}

/**
 * Prepare bubble pressure result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured BubblePressureResult object or null if preparation fails.
 */
export function prepareBubblePressureResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): BubblePressureResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'BP',
    );

    if (res && 'bubble_pressure' in res) {
        return res as BubblePressureResult;
    }
    return null;
}

/**
 * Prepare dew pressure result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured DewPressureResult object or null if preparation fails.
 */
export function prepareDewPressureResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): DewPressureResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'DP',
    );

    if (res && 'dew_pressure' in res) {
        return res as DewPressureResult;
    }
    return null;
}

/**
 * Prepare bubble temperature result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured BubbleTemperatureResult object or null if preparation fails.
 */
export function prepareBubbleTemperatureResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): BubbleTemperatureResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'BT',
    );

    if (res && 'bubble_temperature' in res) {
        return res as BubbleTemperatureResult;
    }
    return null;
}

/**
 * Prepare dew temperature result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured DewTemperatureResult object or null if preparation fails.
 */
export function prepareDewTemperatureResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): DewTemperatureResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'DT',
    );

    if (res && 'dew_temperature' in res) {
        return res as DewTemperatureResult;
    }
    return null;
}

/**
 * Prepare flash isothermal result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured FlashIsothermalResult object or null if preparation fails.
 */
export function prepareFlashIsothermalResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): FlashIsothermalResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'IF',
    );

    if (res && 'V_F_ratio' in res) {
        return res as FlashIsothermalResult;
    }
    return null;
}

/**
 * Prepare check flash isothermal result structure for output.
 *
 * @param componentNames - List of component names involved in the calculation.
 * @param components - List of Component objects used in the calculation.
 * @param data - Raw data dictionary containing calculation results.
 * @returns Structured CheckFlashIsothermalResult object or null if preparation fails.
 */
export function prepareCheckFlashIsothermalResultStructure(
    componentNames: string[],
    components: Component[],
    data: Record<string, any>,
): CheckFlashIsothermalResult | null {
    const res = _preparePressureResultStructure(
        componentNames,
        components,
        data,
        'CIF',
    );

    if (res && 'flash_checker_res' in res && !('V_F_ratio' in res)) {
        return res as CheckFlashIsothermalResult;
    }
    return null;
}
