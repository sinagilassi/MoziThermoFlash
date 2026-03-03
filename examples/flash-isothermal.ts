import { VLE } from "../src/docs";
import { calc_isothermal_flash, is_flashable } from "../src/core/main";
import { type Component, type Pressure, type Temperature } from "mozithermodb-settings";
import {
  model_source_ as modelSource,
  water,
  ethanol,
} from "./model-source.2";
import { createActivityFactory } from "./activity-factory";

const components = ["water-l", "ethanol-l"];
const vle = new VLE(components, modelSource);
const activityFactory = createActivityFactory();

const activity_inputs = {
  alpha: [[0, 0.3], [0.3, 0]],
  a_ij: [[0.0, 3.458], [-0.801, 0.0]],
  b_ij: [[0.0, -586.1], [246.2, 0.0]],
  c_ij: [[0.0, 0.0], [0.0, 0.0]],
  d_ij: [[0.0, 0.0], [0.0, 0.0]],
};

const inputs = {
  mole_fraction: { "water-l": 0.5, "ethanol-l": 0.5 },
  temperature: [30.0, "C"] as [number, string],
  pressure: [7.0, "kPa"] as [number, string],
};

const temperature: Temperature = { value: 30, unit: "C" };
const pressure: Pressure = { value: 7, unit: "kPa" };
const coreComponents: Component[] = [
  { ...water, mole_fraction: 0.5 },
  { ...ethanol, mole_fraction: 0.5 },
];

console.log("is flashable (class)");
console.log(vle.is_flashable(inputs));

console.log("is flashable (core wrapper)");
console.log(is_flashable(coreComponents, temperature, pressure, modelSource));

console.log("flash isothermal (class, least_squares)");
console.log(vle.flash_isothermal(inputs));

console.log("flash isothermal (core wrapper)");
console.log(calc_isothermal_flash(coreComponents, temperature, pressure, modelSource));

console.log("flash isothermal (class, minimize)");
console.log(vle.flash_isothermal(inputs, "raoult", "SRK", "NRTL", "minimize"));

console.log("flash isothermal (modified-raoult + NRTL)");
console.log(
  vle.flash_isothermal(
    inputs,
    "modified-raoult",
    null,
    "NRTL",
    "least_squares",
    false,
    null,
    {
      // activity_inputs are NRTL parameters only.
      activity_inputs,
      // activityFactory provides the runtime model implementation.
      activityFactory,
    }
  )
);
