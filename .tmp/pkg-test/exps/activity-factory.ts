import { activities } from "mozithermomodels";

export function createActivityFactory() {
  return ({ components, modelName }) => {
    const selected = activities({
      components,
      model_name: modelName,
    });

    if (modelName === "NRTL") {
      return { nrtl: selected as unknown };
    }

    return { uniquac: selected as unknown };
  };
}
