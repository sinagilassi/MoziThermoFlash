// CONSTANTS
// --------------

// NOTE: eos models
export const PENG_ROBINSON = "PR";
export const REDLICH_KWONG_SOAVE = "RSK";
export const REDLICH_KWONG = "RK";
export const VAN_DER_WAALS = "VDW";

// NOTE: assumptions
export const RAOULT_MODEL = "raoult";
export const MODIFIED_RAOULT_MODEL = "modified-raoult";

// NOTE: activity coefficient model
export const VAN_LAAR_ACTIVITY_MODEL = "van-laar";
export const WILSON_ACTIVITY_MODEL = "wilson";

// NOTE: universal gas constant[J / mol.K]
export const R_CONST = 8.314472;

// epsilon
export const EPS_CONST = 1e-30;

// NOTE: pi
export const PI_CONST = Math.PI;

// NOTE: STP condition
// pressure[Pa]
export const PRESSURE_STP = 101325;
// temperature[K]
export const TEMPERATURE_STP = 273.15;
// reference temperature[K]
export const TEMPERATURE_REFERENCE = TEMPERATURE_STP + 25.0;

// SECTION: PyThermoDBLink / PyThermoDB
export const DATASOURCE = "datasource";
export const EQUATIONSOURCE = "equationsource";
