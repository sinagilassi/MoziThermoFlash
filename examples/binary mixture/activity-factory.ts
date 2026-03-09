import type { ActivityFactory } from "../../src/docs/activity";
import { activities } from "mozithermomodels";

export function createActivityFactory(): ActivityFactory {
  return ({ components, modelName }) => {
    const selected = activities({
      components,
      model_name: modelName,
    });

    if (modelName === "NRTL") {
      return { nrtl: selected as unknown as ReturnType<ActivityFactory>["nrtl"] };
    }

    return { uniquac: selected as unknown as ReturnType<ActivityFactory>["uniquac"] };
  };
}
