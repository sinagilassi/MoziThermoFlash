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

// 379. to 573.	3.55959	643.748	-198.043
// 293. to 343 6.20963	2354.731	7.559
const waterData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "water", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "H2O", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "A", symbol: "A", value: 6.20963, unit: "1" },
  { name: "B", symbol: "B", value: 2354.731, unit: "1" },
  { name: "C", symbol: "C", value: 7.559, unit: "1" },
  { name: "Tmin", symbol: "Tmin", value: 293, unit: "K" },
  { name: "Tmax", symbol: "Tmax", value: 343, unit: "K" },
];

// 364.8 to 513.91	4.92531	1432.526	-61.819
// 292.77 to 366.63	5.24677	1598.673	-46.424
const ethanolData: RawThermoRecord[] = [
  { name: "Name", symbol: "Name", value: "ethanol", unit: "N/A" },
  { name: "Formula", symbol: "Formula", value: "C2H6O", unit: "N/A" },
  { name: "State", symbol: "State", value: "l", unit: "N/A" },
  { name: "A", symbol: "A", value: 5.24677, unit: "1" },
  { name: "B", symbol: "B", value: 1598.673, unit: "1" },
  { name: "C", symbol: "C", value: -46.424, unit: "1" },
  { name: "Tmin", symbol: "Tmin", value: 292.77, unit: "K" },
  { name: "Tmax", symbol: "Tmax", value: 366.63, unit: "K" },
];

const dataBlocks: RawThermoRecord[][] = [waterData, ethanolData];

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

export { water, ethanol, components, datasource, equationsource, model_source_ };
