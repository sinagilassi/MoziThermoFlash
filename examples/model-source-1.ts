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
  { name: "A", symbol: "A", value: 4.72583, unit: "1" },
  { name: "B", symbol: "B", value: 1660.652, unit: "1" },
  { name: "C", symbol: "C", value: -1.461, unit: "1" },
];

const tolueneData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "toluene", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "C7H8", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "A", symbol: "A", value: 4.23679, unit: "1" },
  { name: "B", symbol: "B", value: 1426.448, unit: "1" },
  { name: "C", symbol: "C", value: -45.957, unit: "1" },
];

const dataBlocks: RawThermoRecord[][] = [benzeneData, tolueneData];

// SECTION: Vapor pressure
// log10(P) = A − (B / (T + C))
//     P = vapor pressure (bar)
//     T = temperature (K)

const vapourPressureEquation = createEq(
  {},
  {
    A: { name: "A", symbol: "A", unit: "1" },
    B: { name: "B", symbol: "B", unit: "1" },
    C: { name: "C", symbol: "C", unit: "1" },
    T: { name: "temperature", symbol: "T", unit: "K" },
  },
  {
    VaPr: { name: "vapor-pressure", symbol: "VaPr", unit: "bar" },
  },
  (_params, args) => {
    const T = args.T.value;
    const value = Math.pow(
      10,
      args.A.value - args.B.value / (T + args.C.value)
    );

    return {
      value,
      unit: "bar",
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
