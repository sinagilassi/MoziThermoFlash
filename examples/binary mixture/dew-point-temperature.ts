import { VLE } from "../../src/docs";
import { calc_dew_point_temperature } from "../../src/core/main";
import { type Component, type Pressure } from "mozithermodb-settings";
import {
  model_source_ as modelSource,
  benzene,
  toluene,
} from "../model-source-1";
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

const inputs = {
  mole_fraction: { "benzene-l": 0.26, "toluene-l": 0.74 },
  pressure: [101.3, "kPa"] as [number, string],
};

const dewTemperatureOptions = {
  guess_temperature: 350,
  max_iter: 600,
  tolerance: 1e-8,
};

const pressure: Pressure = { value: 101.3, unit: "kPa" };
const coreComponents: Component[] = [
  { ...benzene, mole_fraction: 0.26 },
  { ...toluene, mole_fraction: 0.74 },
];

console.log("dew temperature (raoult)");
console.log(vle.dew_temperature(inputs, "raoult", null, null, "fsolve", null, dewTemperatureOptions));

console.log("dew temperature (core wrapper)");
console.log(calc_dew_point_temperature(coreComponents, pressure, modelSource));

console.log("dew temperature (modified-raoult + NRTL)");
console.log(
  vle.dew_temperature(
    inputs,
    "modified-raoult",
    null,
    "NRTL",
    "least-squares",
    null,
    {
      ...dewTemperatureOptions,
      activity_inputs,
      activityFactory,
    }
  )
);
