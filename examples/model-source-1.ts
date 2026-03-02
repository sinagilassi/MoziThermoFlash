import { ComponentSchema, type Component } from "mozithermodb-settings";
import {
  buildComponentsData,
  buildComponentsEquation,
  createEq,
  type ModelSource,
  type RawThermoRecord,
} from "mozithermodb";

const benzene = ComponentSchema.parse({
  name: "benzene",
  formula: "C6H6",
  state: "l",
});

const toluene = ComponentSchema.parse({
  name: "toluene",
  formula: "C7H8",
  state: "l",
});

const components: Component[] = [benzene, toluene];

const benzeneData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "benzene", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "C6H6", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "C1", symbol: "C1", value: 83.107, unit: "1" },
  { name: "C2", symbol: "C2", value: -6486.2, unit: "1" },
  { name: "C3", symbol: "C3", value: -9.2194, unit: "1" },
  { name: "C4", symbol: "C4", value: 6.98e-6, unit: "1" },
  { name: "C5", symbol: "C5", value: 2, unit: "1" },
];

const tolueneData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "toluene", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "C7H8", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "C1", symbol: "C1", value: 80.877, unit: "1" },
  { name: "C2", symbol: "C2", value: -6902.0, unit: "1" },
  { name: "C3", symbol: "C3", value: -9.62, unit: "1" },
  { name: "C4", symbol: "C4", value: 7.2e-6, unit: "1" },
  { name: "C5", symbol: "C5", value: 2, unit: "1" },
];

const dataBlocks: RawThermoRecord[][] = [benzeneData, tolueneData];

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

export { benzene, toluene, components, datasource, equationsource, model_source_ };
