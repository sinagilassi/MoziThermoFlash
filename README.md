# MoziThermoFlash

[![npm version](https://badge.fury.io/js/mozithermoflash.svg)](https://badge.fury.io/js/mozithermoflash)
[![npm downloads](https://img.shields.io/npm/dm/mozithermoflash?color=brightgreen)](https://www.npmjs.com/package/mozithermoflash)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

MoziThermoFlash is a TypeScript VLE toolkit for common flash and phase-equilibrium calculations on multi-component mixtures. It is designed to work with `mozithermodb` model sources and supports both class-based and wrapper-style APIs.

## ✨ Features

- ✅ Bubble-point pressure
- ✅ Dew-point pressure
- ✅ Bubble-point temperature
- ✅ Dew-point temperature
- ✅ Isothermal flash
- ✅ Flash feasibility check (`is_flashable`)
- ✅ Raoult and modified-Raoult workflows
- ✅ Optional activity-model hooks (NRTL/UNIQUAC runtime inputs)

## 📦 Installation

```bash
npm install mozithermoflash
```

## 🧱 Core Idea

This package expects a `model_source` containing:

- `dataSource`
- `equationSource`

In this repo, those are created in example files like:

- `examples/model-source-1.ts`
- `examples/model-source.2.ts`

## 🚀 Usage Patterns

Two styles are used in this project:

1. `VLE` class methods (from `src/docs/vle.ts`)
2. Core wrapper functions (from `src/core/main.ts`)

### Class API (`VLE`)

- `bubble_pressure(...)`
- `dew_pressure(...)`
- `bubble_temperature(...)`
- `dew_temperature(...)`
- `flash_isothermal(...)`
- `is_flashable(...)`

### Wrapper API

- `calc_bubble_point_pressure(...)`
- `calc_dew_point_pressure(...)`
- `calc_bubble_point_temperature(...)`
- `calc_dew_point_temperature(...)`
- `calc_isothermal_flash(...)`
- `is_flashable(...)`

## 🧪 Examples

Run examples with `tsx`:

```bash
npx tsx examples/bubble-point-pressure.ts
npx tsx examples/dew-point-pressure.ts
npx tsx examples/bubble-point-temperature.ts
npx tsx examples/dew-point-temperature.ts
npx tsx examples/flash-isothermal.ts
```

Other useful example files:

- `examples/activity-factory.ts` (activity model factory pattern)
- `examples/matrix-model-source.ts` (binary-mixture matrix datasource pattern)

## 🧠 Notes

- Inputs in examples are provided as `[value, unit]` tuples (for temperature/pressure).
- Component IDs in examples follow `Name-State` (e.g., `benzene-l`).
- For modified-Raoult runs, activity parameters are passed via `kwargs` (`activity_inputs`, `activityFactory`, or explicit `activity_coefficients`).

## 📄 License

Licensed under the Apache-2.0 License. See `LICENSE`.

## ❓ FAQ

For questions, contact Sina Gilassi on [LinkedIn](https://www.linkedin.com/in/sina-gilassi/).

## 👨‍💻 Author

- [@sinagilassi](https://github.com/sinagilassi)
