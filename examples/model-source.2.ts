import { ComponentSchema, type Component } from "mozithermodb-settings";
import {
  buildComponentsData,
  buildComponentsEquation,
  createEq,
  type ModelSource,
  type RawThermoRecord,
} from "mozithermodb";

const water = ComponentSchema.parse({
  name: "water",
  formula: "H2O",
  state: "l",
});

const ethanol = ComponentSchema.parse({
  name: "ethanol",
  formula: "C2H6O",
  state: "l",
});

const components: Component[] = [water, ethanol];

const waterData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "water", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "H2O", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "C1", symbol: "C1", value: 73.649, unit: "1" },
  { name: "C2", symbol: "C2", value: -7258.2, unit: "1" },
  { name: "C3", symbol: "C3", value: -7.3037, unit: "1" },
  { name: "C4", symbol: "C4", value: 4.17e-6, unit: "1" },
  { name: "C5", symbol: "C5", value: 2, unit: "1" },
];

const ethanolData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "ethanol", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "C2H6O", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "C1", symbol: "C1", value: 73.304, unit: "1" },
  { name: "C2", symbol: "C2", value: -7122.3, unit: "1" },
  { name: "C3", symbol: "C3", value: -7.1424, unit: "1" },
  { name: "C4", symbol: "C4", value: 2.89e-6, unit: "1" },
  { name: "C5", symbol: "C5", value: 2, unit: "1" },
];

const dataBlocks: RawThermoRecord[][] = [waterData, ethanolData];

const vapourPressureEquation = createEq(
  {},
  {
    C1: { name: "C1", symbol: "C1", unit: "1" },
    C2: { name: "C2", symbol: "C2", unit: "1" },
    C3: { name: "C3", symbol: "C3", unit: "1" },
    C4: { name: "C4", symbol: "C4", unit: "1" },
    C5: { name: "C5", symbol: "C5", unit: "1" },
    T: { name: "temperature", symbol: "T", unit: "K" },
  },
  {
    VaPr: { name: "vapor-pressure", symbol: "VaPr", unit: "Pa" },
  },
  (_params, args) => {
    const T = args.T.value;
    const value = Math.exp(
      args.C1.value +
        args.C2.value / T +
        args.C3.value * Math.log(T) +
        args.C4.value * T ** args.C5.value
    );

    return {
      value,
      unit: "Pa",
      symbol: "VaPr",
    };
  },
  "VaporPressure",
  "Generalized vapor-pressure equation"
);

const datasource = buildComponentsData(
  components,
  dataBlocks,
  ["Name-State"],
  true,
  "Name-State"
);

const equationsource = buildComponentsEquation(
  components,
  vapourPressureEquation,
  dataBlocks,
  ["Name-State"],
  true,
  "Name-State"
);

const model_source_: ModelSource = {
  dataSource: datasource,
  equationSource: equationsource,
};

export { water, ethanol, components, datasource, equationsource, model_source_ };
