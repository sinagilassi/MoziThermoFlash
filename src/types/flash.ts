//  import libs
import { Temperature, Pressure, Component, CustomProp, CustomProperty } from "mozithermodb-settings";

/**
 * Generic quantity with value + unit (e.g. Pa, K, s, dimensionless).
 */
export interface Quantity<T> {
    value?: T;
    unit: string;
    symbol: string;
}

export interface ComponentProps<T = any> {
    component: Component;
    properties: Record<string, Quantity<T>>;
}


// SECTION: pressure result model

/**
 * Example bubble pressure result:
 * {
 *     'bubble_pressure': { 'value': 54880.72088600001, 'unit': 'Pa' },
 *     'temperature': { 'value': 353.15, 'unit': 'K' },
 *     'feed_mole_fraction': array([0.26, 0.74]),
 *     'vapor_mole_fraction': array([0.47787172, 0.52212828]),
 *     'liquid_mole_fraction': array([0.26, 0.74]),
 *     'mole_fraction_sum': { 'zi': 1.0, 'xi': 1.0, 'yi': 0.9999999999999999 },
 *     'vapor_pressure': { 'value': array([100869.017, 38722.6709]), 'unit': 'Pa' },
 *     'activity_coefficient': { 'value': array([1., 1.]), 'unit': 'dimensionless' },
 *     'K_ratio': { 'value': array([1.83796815, 0.70557876]), 'unit': 'dimensionless' },
 *     'message': 'Bubble Pressure Calculation',
 *     'components': ['benzene-l', 'toluene-l'],
 *     'equilibrium_model': 'raoult',
 *     'fugacity_model': null,
 *     'activity_model': null,
 *     'computation_time': { 'value': 0.0009999275207519531, 'unit': 's' }
 * }
 */
export interface BubblePressureResult {
    /** Calculated bubble-point pressure. */
    bubble_pressure: Pressure;
    /** System temperature. */
    temperature: Temperature;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];

    feed_mole_fraction: Component[];
    vapor_mole_fraction: Component[];
    liquid_mole_fraction: Component[];
    mole_fraction_sum: Record<string, number>;

    /** List of component properties used in the calculation. */
    component_props: ComponentProps[];

    message: string;

    equilibrium_model: string | null;
    fugacity_model: string | null;
    activity_model: string | null;

    computation_time: Quantity<number> | null;

    [key: string]: any; // Allow extra properties
}

/**
 * Example dew pressure result:
 * {
 *     'dew_pressure': { 'value': 46108.761202690344, 'unit': 'Pa' },
 *     'temperature': { 'value': { 'value': 353.15, 'unit': 'K' }, 'unit': 'K' },
 *     'feed_mole_fraction': array([0.26, 0.74]),
 *     'vapor_mole_fraction': array([0.26, 0.74]),
 *     'liquid_mole_fraction': array([0.11884995, 0.88115005]),
 *     'mole_fraction_sum': { 'zi': 1.0, 'xi': 1.0, 'yi': 1.0 },
 *     'vapor_pressure': { 'value': array([100869.017, 38722.6709]), 'unit': 'Pa' },
 *     'activity_coefficient': { 'value': array([1., 1.]), 'unit': 'dimensionless' },
 *     'K_ratio': { 'value': array([2.18763234, 0.83981156]), 'unit': 'dimensionless' },
 *     'max_iter': 500,
 *     'iteration': 0,
 *     'tolerance': 1e-06,
 *     'message': 'Dew Pressure Calculation',
 *     'components': ['benzene-l', 'toluene-l'],
 *     'equilibrium_model': 'raoult',
 *     'fugacity_model': null,
 *     'activity_model': null,
 *     'computation_time': { 'value': 0.0010080337524414062, 'unit': 's' }
 * }
 */
export interface DewPressureResult {
    /** Calculated dew-point pressure. */
    dew_pressure: Pressure;
    /** System temperature. */
    temperature: Temperature;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];

    feed_mole_fraction: Component[];
    vapor_mole_fraction: Component[];
    liquid_mole_fraction: Component[];
    mole_fraction_sum: Record<string, number>;

    /** List of component properties used in the calculation. */
    component_props: ComponentProps[];

    message: string;

    equilibrium_model: string | null;
    fugacity_model: string | null;
    activity_model: string | null;

    computation_time: Quantity<number> | null;

    max_iter?: number | null;
    iteration?: number | null;
    tolerance?: number | null;

    [key: string]: any; // Allow extra properties
}

// SECTION: temperature result model

/**
 * Example bubble temperature result:
 * {
 *     'bubble_temperature': { 'value': 373.07718645402184, 'unit': 'K' },
 *     'pressure': { 'value': 101299.99999999999, 'unit': 'Pa' },
 *     'feed_mole_fraction': [0.26, 0.74],
 *     'liquid_mole_fraction': [0.26, 0.74],
 *     'vapor_mole_fraction': [0.4605291602566635, 0.53947083994077],
 *     'mole_fraction_sum': { 'zi': 1.0, 'xi': 1.0, 'yi': 1.0000000001974336 },
 *     'vapor_pressure': { 'value': [179429.2459, 73849.1839], 'unit': 'Pa' },
 *     'K_ratio': { 'value': [1.7712660009871672, 0.7290146485686082], 'unit': 'dimensionless' },
 *     'activity_coefficient': { 'value': [1.0, 1.0], 'unit': 'dimensionless' },
 *     'message': 'Bubble Temperature Calculation',
 *     'components': ['benzene-l', 'toluene-l'],
 *     'equilibrium_model': 'raoult',
 *     'fugacity_model': null,
 *     'activity_model': null,
 *     'solver_method': 'root',
 *     'computation_time': { 'value': 0.005999326705932617, 'unit': 's' }
 * }
 */
export interface BubbleTemperatureResult {
    /** Calculated bubble-point temperature. */
    bubble_temperature: Temperature;
    /** System pressure. */
    pressure: Pressure;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];

    feed_mole_fraction: Component[];
    vapor_mole_fraction: Component[];
    liquid_mole_fraction: Component[];
    mole_fraction_sum: Record<string, number>;

    /** List of component properties used in the calculation. */
    component_props: ComponentProps[];

    message: string;

    equilibrium_model: string | null;
    fugacity_model: string | null;
    activity_model: string | null;

    solver_method?: string | null;

    computation_time: Quantity<number> | null;

    [key: string]: any; // Allow extra properties
}

/**
 * Example dew temperature result:
 * {
 *     'dew_temperature': { 'value': 378.1633323578604, 'unit': 'K' },
 *     'pressure': { 'value': 101299.99999999999, 'unit': 'Pa' },
 *     'feed_mole_fraction': [0.26, 0.74],
 *     'liquid_mole_fraction': [0.1281658714162829, 0.8718341283338952],
 *     'vapor_mole_fraction': [0.26, 0.74],
 *     'mole_fraction_sum': { 'xi': 0.9999999997501781, 'yi': 1.0, 'zi': 1.0 },
 *     'vapor_pressure': { 'value': [205499.3245, 85981.9518], 'unit': 'Pa' },
 *     'K_ratio': { 'value': [0.4929456592933958, 1.1781542274782366], 'unit': 'dimensionless' },
 *     'activity_coefficient': { 'value': [1.0, 1.0], 'unit': 'dimensionless' },
 *     'message': 'Dew Temperature Calculation',
 *     'components': ['benzene-l', 'toluene-l'],
 *     'equilibrium_model': 'raoult',
 *     'fugacity_model': null,
 *     'activity_model': null,
 *     'solver_method': 'root',
 *     'computation_time': { 'value': 0.012703895568847656, 'unit': 's' }
 * }
 */
export interface DewTemperatureResult {
    /** Calculated dew-point temperature. */
    dew_temperature: Temperature;
    /** System pressure. */
    pressure: Pressure;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];

    feed_mole_fraction: Component[];
    vapor_mole_fraction: Component[];
    liquid_mole_fraction: Component[];
    mole_fraction_sum: Record<string, number>;

    /** List of component properties used in the calculation. */
    component_props: ComponentProps[];

    message: string;

    equilibrium_model: string | null;
    fugacity_model: string | null;
    activity_model: string | null;

    solver_method?: string | null;

    computation_time: Quantity<number> | null;

    [key: string]: any; // Allow extra properties
}

// SECTION: flash result model

/**
 * Example check flash isothermal result:
 * {
 *     'message': 'Is Flashable Calculation',
 *     'pressure': { 'value': 7000.000000000001, 'unit': 'Pa' },
 *     'temperature': { 'value': 303.15, 'unit': 'K' },
 *     'feed_mole_fraction': { 'water-l': 0.5, 'ethanol-l': 0.5 },
 *     'components': ['water-l', 'ethanol-l'],
 *     'equilibrium_model': 'raoult',
 *     'flash_checker_res': true,
 *     'computation_time': { 'value': 0.0022618770599365234, 'unit': 's' }
 * }
 */
export interface CheckFlashIsothermalResult {
    /** System pressure. */
    pressure: Pressure;
    /** System temperature. */
    temperature: Temperature;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];
    components: Component[];

    feed_mole_fraction: Component[];

    equilibrium_model: string | null;

    flash_checker_res: boolean | null;

    message: string;
    computation_time: Quantity<number> | null;

    [key: string]: any; // Allow extra properties
}

/**
 * Example flash isothermal result:
 * {
 *     'V_F_ratio': { 'value': 0.2811011075571349, 'unit': 'dimensionless' },
 *     'L_F_ratio': { 'value': 0.7188988924428651, 'unit': 'dimensionless' },
 *     'feed_mole_fraction': array([0.5, 0.5]),
 *     'liquid_mole_fraction': array([0.56207734, 0.43792266]),
 *     'vapor_mole_fraction': array([0.34124099, 0.658759]),
 *     'mole_fraction_sum': { 'xi': 1.0000000027740075, 'yi': 0.9999999929056453, 'zi': 1.0 },
 *     'vapor_pressure': { 'value': array([4249.7478, 10529.9712]), 'unit': 'Pa' },
 *     'K_ratio': { 'value': array([0.60710683, 1.5042816]), 'unit': 'dimensionless' },
 *     'temperature': { 'value': 303.15, 'unit': 'K' },
 *     'pressure': { 'value': 7000.000000000001, 'unit': 'Pa' },
 *     'activity_coefficient': { 'value': array([1., 1.]), 'unit': 'dimensionless' },
 *     'solver_message': '`gtol` termination condition is satisfied.',
 *     'message': 'Flash Isothermal Calculation',
 *     'components': ['water-l', 'ethanol-l'],
 *     'equilibrium_model': 'raoult',
 *     'flash_checker': false,
 *     'flash_checker_res': null,
 *     'fugacity_model': null,
 *     'activity_model': null,
 *     'solver_method': 'least_squares',
 *     'computation_time': { 'value': 0.005997419357299805, 'unit': 's' }
 * }
 */
export interface FlashIsothermalResult {
    /** Vapor fraction ratio. */
    V_F_ratio: Quantity<number>;
    /** Liquid fraction ratio. */
    L_F_ratio: Quantity<number>;
    feed_mole_fraction: Component[];
    liquid_mole_fraction: Component[];
    vapor_mole_fraction: Component[];
    mole_fraction_sum: Record<string, number>;

    /** List of component properties used in the calculation. */
    component_props: ComponentProps[];

    /** System temperature. */
    temperature: Temperature;
    /** System pressure. */
    pressure: Pressure;
    /** List of component IDs involved in the calculation. */
    component_ids: string[];

    equilibrium_model: string | null;
    fugacity_model: string | null;
    activity_model: string | null;

    flash_checker?: boolean | null;
    flash_checker_res?: boolean | null;

    solver_method?: string | null;
    solver_message?: string | null;

    message: string;
    computation_time: Quantity<number> | null;

    [key: string]: any; // Allow extra properties
}
