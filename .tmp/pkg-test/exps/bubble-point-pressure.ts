import { VLE } from "mozithermoflash";
import {
  calc_bubble_point_pressure,
  calc_dew_point_pressure,
} from "mozithermoflash";
import { type Component, type Temperature } from "mozithermodb-settings";
import {
  model_source_ as modelSource,
  benzene,
  toluene,
} from "./model-source-1";
import { createActivityFactory } from "./activity-factory";

const components = ["benzene-l", "toluene-l"];
const vle = new VLE(components, modelSource);
const activityFactory = createActivityFactory();

const activity_inputs = {
  alpha: [[0, 0.3], [0.3, 0]],
  a_ij: [[0.0, -2.885], [2.191, 0.0]],
  b_ij: [[0.0, 1124], [-863.7, 0.0]],
  c_ij: [[0.0, 0.0], [0.0, 0.0]],
  d_ij: [[0.0, 0.0], [0.0, 0.0]],
};

const activity_coefficients = {
  "benzene-l": 1.0,
  "toluene-l": 1.1,
};

const inputs = {
  mole_fraction: { "benzene-l": 0.26, "toluene-l": 0.74 },
  temperature: [80, "C"] as [number, string],
};

const temperature: Temperature = { value: 80, unit: "C" };
const coreComponents: Component[] = [
  { ...benzene, mole_fraction: 0.26 },
  { ...toluene, mole_fraction: 0.74 },
];

console.log("bubble pressure (raoult)");
console.log(vle.bubble_pressure(inputs, "raoult"));

console.log("bubble pressure (core wrapper)");
console.log(calc_bubble_point_pressure(coreComponents, temperature, modelSource));

console.log("bubble pressure (modified-raoult + NRTL)");
console.log(
  vle.bubble_pressure(inputs, "modified-raoult", null, "NRTL", null, {
    // activity_inputs are NRTL parameters only.
    activity_inputs,
    // activityFactory provides the runtime model implementation.
    // activityFactory,
  })
);

console.log("bubble pressure (modified-raoult + explicit gamma)");
console.log(
  vle.bubble_pressure(inputs, "modified-raoult", null, "NRTL", null, {
    activity_coefficients,
  })
);

console.log("dew pressure (raoult)");
console.log(vle.dew_pressure(inputs, "raoult"));

console.log("dew pressure (core wrapper)");
console.log(calc_dew_point_pressure(coreComponents, temperature, modelSource));

console.log("dew pressure (modified-raoult + NRTL)");
console.log(
  vle.dew_pressure(inputs, "modified-raoult", null, "NRTL", null, {
    // activity_inputs are NRTL parameters only.
    activity_inputs,
    // activityFactory provides the runtime model implementation.
    // activityFactory,
  })
);

console.log("dew pressure (modified-raoult + explicit gamma)");
console.log(
  vle.dew_pressure(inputs, "modified-raoult", null, "NRTL", null, {
    activity_coefficients,
  })
);
