import { convertFromTo, to } from "mozicuc";
import { Source, type ArgInputMap, type ArgMap, type ModelSource } from "mozithermodb";
import { Equilibria } from "./equilibria";

type EquilibriumModel = "raoult" | "modified-raoult";
type FugacityModel = "vdW" | "PR" | "RK" | "SRK" | null;
type ActivityModel = "NRTL" | "UNIQUAC" | null;

type ModelSourceLegacy = {
    datasource?: Record<string, unknown>;
    equationsource?: Record<string, unknown>;
};

type ModelSourceInput = ModelSourceLegacy | ModelSource | null;

type ModelSelection = {
    equilibrium_model: string;
    fugacity_model: FugacityModel;
    activity_model: ActivityModel;
};

export class VLE extends Equilibria {
    private readonly _modelSource: ModelSourceInput;
    private readonly _source: Source;

    constructor(components: string[], model_source: ModelSourceInput = null) {
        const normalized = VLE.normalizeModelSource(model_source);

        super(components, {
            datasource: normalized.datasource,
            equationsource: normalized.equationsource,
        });

        this._modelSource = model_source;
        this._source = new Source(
            {
                dataSource: normalized.datasource,
                equationSource: normalized.equationsource,
            } as any,
            "Name-State"
        );
    }

    public get model_source(): ModelSourceInput {
        return this._modelSource;
    }

    public get datasource(): Record<string, unknown> {
        const normalized = VLE.normalizeModelSource(this._modelSource);
        return normalized.datasource;
    }

    public get equationsource(): Record<string, unknown> {
        const normalized = VLE.normalizeModelSource(this._modelSource);
        return normalized.equationsource;
    }

    public bubble_pressure(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        fugacity_model: FugacityModel = null,
        activity_model: ActivityModel = null,
        message: string | null = null,
        kwargs: Record<string, any> = {}
    ): Record<string, any> {
        try {
            const start = Date.now();

            this.validateInputs(inputs, ["mole_fraction", "temperature"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const temperature = Number(convertFromTo(inputs.temperature[0], inputs.temperature[1], "K"));

            const vaPrComp = this.buildVaporPressureSource(temperature, false);
            const models = this.set_models(equilibrium_model, fugacity_model, activity_model);

            const params = {
                components: this.components,
                mole_fraction: moleFractions,
                temperature: { value: temperature, unit: "K" },
                vapor_pressure: vaPrComp,
                equilibrium_model,
                fugacity_model: models.fugacity_model,
                activity_model: models.activity_model,
            };

            const res = this._BP(params, kwargs);
            res.message = message ?? "Bubble Pressure Calculation";
            res.components = this.components;
            res.equilibrium_model = equilibrium_model;
            res.fugacity_model = models.fugacity_model;
            res.activity_model = models.activity_model;
            res.computation_time = {
                value: (Date.now() - start) / 1000,
                unit: "s",
            };

            return res;
        } catch (error) {
            throw new Error(`Error in bubble_pressure calculation: ${this.formatError(error)}`);
        }
    }

    public dew_pressure(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        fugacity_model: FugacityModel = null,
        activity_model: ActivityModel = null,
        message: string | null = null,
        kwargs: Record<string, any> = {}
    ): Record<string, any> {
        try {
            const start = Date.now();

            this.validateInputs(inputs, ["mole_fraction", "temperature"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const temperature = Number(convertFromTo(inputs.temperature[0], inputs.temperature[1], "K"));

            const vaPrComp = this.buildVaporPressureSource(temperature, true);
            const models = this.set_models(equilibrium_model, fugacity_model, activity_model);

            const params = {
                components: this.components,
                mole_fraction: moleFractions,
                temperature: { value: temperature, unit: "K" },
                vapor_pressure: vaPrComp,
                equilibrium_model,
                fugacity_model: models.fugacity_model,
                activity_model: models.activity_model,
            };

            const res = this._DP(params, kwargs);
            res.message = message ?? "Dew Pressure Calculation";
            res.components = this.components;
            res.equilibrium_model = equilibrium_model;
            res.fugacity_model = models.fugacity_model;
            res.activity_model = models.activity_model;
            res.computation_time = {
                value: (Date.now() - start) / 1000,
                unit: "s",
            };

            return res;
        } catch (error) {
            throw new Error(`Error in dew_pressure calculation: ${this.formatError(error)}`);
        }
    }

    public bubble_temperature(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        fugacity_model: FugacityModel = "SRK",
        activity_model: ActivityModel = "NRTL",
        solver_method: "root" | "least-squares" | "fsolve" = "root",
        message: string | null = null,
        kwargs: Record<string, any> = {}
    ): Record<string, any> {
        try {
            const start = Date.now();
            this.validateInputs(inputs, ["mole_fraction", "pressure"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const pressure = Number(convertFromTo(inputs.pressure[0], inputs.pressure[1], "Pa"));

            const vaPrComp = this.buildVaporPressureSource(null, true);
            const models = this.set_models(equilibrium_model, fugacity_model, activity_model);

            const params = {
                components: this.components,
                mole_fraction: moleFractions,
                pressure: { value: pressure, unit: "Pa" },
                vapor_pressure: vaPrComp,
                equilibrium_model,
                fugacity_model: models.fugacity_model,
                activity_model: models.activity_model,
                solver_method,
            };

            const res = this._BT(params, kwargs);
            res.message = message ?? "Bubble Temperature Calculation";
            res.components = this.components;
            res.equilibrium_model = equilibrium_model;
            res.fugacity_model = models.fugacity_model;
            res.activity_model = models.activity_model;
            res.solver_method = solver_method;
            res.computation_time = {
                value: (Date.now() - start) / 1000,
                unit: "s",
            };

            return res;
        } catch (error) {
            throw new Error(`Error in bubble_temperature calculation: ${this.formatError(error)}`);
        }
    }

    public dew_temperature(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        fugacity_model: FugacityModel = "SRK",
        activity_model: ActivityModel = "NRTL",
        solver_method: "root" | "least-squares" | "fsolve" = "root",
        message: string | null = null,
        kwargs: Record<string, any> = {}
    ): Record<string, any> {
        try {
            const start = Date.now();
            this.validateInputs(inputs, ["mole_fraction", "pressure"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const pressure = Number(convertFromTo(inputs.pressure[0], inputs.pressure[1], "Pa"));

            const vaPrComp = this.buildVaporPressureSource(null, true);
            const models = this.set_models(equilibrium_model, fugacity_model, activity_model);

            const params = {
                components: this.components,
                mole_fraction: moleFractions,
                pressure: { value: pressure, unit: "Pa" },
                vapor_pressure: vaPrComp,
                equilibrium_model,
                fugacity_model: models.fugacity_model,
                activity_model: models.activity_model,
                solver_method,
            };

            const res = this._DT(params, kwargs);
            res.message = message ?? "Dew Temperature Calculation";
            res.components = this.components;
            res.equilibrium_model = equilibrium_model;
            res.fugacity_model = models.fugacity_model;
            res.activity_model = models.activity_model;
            res.solver_method = solver_method;
            res.computation_time = {
                value: (Date.now() - start) / 1000,
                unit: "s",
            };

            return res;
        } catch (error) {
            throw new Error(`Error in dew_temperature calculation: ${this.formatError(error)}`);
        }
    }

    public flash_isothermal(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        fugacity_model: FugacityModel = "SRK",
        activity_model: ActivityModel = "NRTL",
        solver_method: "least_squares" | "minimize" = "least_squares",
        flash_checker = false,
        message: string | null = null,
        kwargs: Record<string, any> = {}
    ): Record<string, any> {
        try {
            const start = Date.now();
            this.validateInputs(inputs, ["mole_fraction", "pressure", "temperature"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const pressure = Number(convertFromTo(inputs.pressure[0], inputs.pressure[1], "Pa"));
            const temperature = Number(convertFromTo(inputs.temperature[0], inputs.temperature[1], "K"));

            const vaPrComp = this.buildVaporPressureSource(temperature, true);
            const models = this.set_models(equilibrium_model, fugacity_model, activity_model);

            const params = {
                components: this.components,
                mole_fraction: moleFractions,
                pressure: { value: pressure, unit: "Pa" },
                temperature: { value: temperature, unit: "K" },
                vapor_pressure: vaPrComp,
                equilibrium_model,
                fugacity_model: models.fugacity_model,
                activity_model: models.activity_model,
                solver_method,
            };

            let flashCheckerRes: boolean | null = null;
            if (flash_checker) {
                flashCheckerRes = this._flash_checker({
                    z_i: moleFractions,
                    Pf: pressure,
                    Tf: temperature,
                    VaPr_comp: vaPrComp,
                });

                if (!flashCheckerRes) {
                    throw new Error("Flash calculation failed! The system is not in a two-phase region.");
                }
            }

            const res = this._IFL(params, kwargs);
            res.message = message ?? "Flash Isothermal Calculation";
            res.components = this.components;
            res.equilibrium_model = equilibrium_model;
            res.flash_checker = flash_checker;
            res.flash_checker_res = flashCheckerRes;
            res.fugacity_model = models.fugacity_model;
            res.activity_model = models.activity_model;
            res.solver_method = solver_method;
            res.computation_time = {
                value: (Date.now() - start) / 1000,
                unit: "s",
            };

            return res;
        } catch (error) {
            throw new Error(`Error in flash_isothermal calculation: ${this.formatError(error)}`);
        }
    }

    public is_flashable(
        inputs: Record<string, any>,
        equilibrium_model: EquilibriumModel = "raoult",
        message: string | null = null
    ): Record<string, any> {
        try {
            const start = Date.now();
            this.validateInputs(inputs, ["mole_fraction", "pressure", "temperature"]);

            const moleFractions = this.extractMoleFractions(inputs.mole_fraction);
            const pressure = Number(convertFromTo(inputs.pressure[0], inputs.pressure[1], "Pa"));
            const temperature = Number(convertFromTo(inputs.temperature[0], inputs.temperature[1], "K"));

            const vaPrComp = this.buildVaporPressureSource(temperature, true);

            const flashCheckerRes = this._flash_checker({
                z_i: moleFractions,
                Pf: pressure,
                Tf: temperature,
                VaPr_comp: vaPrComp,
            });

            return {
                message: message ?? "Is Flashable Calculation",
                pressure: { value: pressure, unit: "Pa" },
                temperature: { value: temperature, unit: "K" },
                feed_mole_fraction: moleFractions,
                components: this.components,
                equilibrium_model,
                flash_checker_res: flashCheckerRes,
                computation_time: {
                    value: (Date.now() - start) / 1000,
                    unit: "s",
                },
            };
        } catch (error) {
            throw new Error(`Error in is_flashable: ${this.formatError(error)}`);
        }
    }

    private set_models(
        equilibrium_model: string,
        fugacity_model: FugacityModel,
        activity_model: ActivityModel
    ): ModelSelection {
        if (equilibrium_model === "raoult") {
            return {
                equilibrium_model,
                fugacity_model: null,
                activity_model: null,
            };
        }

        if (equilibrium_model === "modified-raoult") {
            return {
                equilibrium_model,
                fugacity_model: null,
                activity_model,
            };
        }

        if (equilibrium_model === "fugacity-ratio") {
            return {
                equilibrium_model,
                fugacity_model,
                activity_model: null,
            };
        }

        throw new Error(`Invalid equilibrium model: ${equilibrium_model}.`);
    }

    private extractMoleFractions(input: Record<string, unknown>): number[] {
        if (typeof input !== "object" || input === null) {
            throw new Error("Mole fractions must be a dictionary.");
        }

        return this.components.map((component) => {
            const value = (input as Record<string, unknown>)[component];
            if (typeof value !== "number") {
                throw new Error(`Mole fraction for '${component}' must be numeric.`);
            }
            if (value < 0 || value > 1) {
                throw new Error("Mole fractions must be between 0 and 1.");
            }
            return value;
        });
    }

    private buildVaporPressureSource(
        temperature: number | null,
        includeEquation: boolean
    ): Record<string, any> {
        const source: Record<string, any> = {};

        for (const component of this.components) {
            const vaPrEq = this._source.eqExtractor(component, "VaPr");
            if (!vaPrEq) {
                throw new Error(`VaPr equation not found for component '${component}'.`);
            }

            const args = this._source.buildArgs(
                component,
                this._source.checkArgs(component, vaPrEq.configArguments)
            );

            if (!args.T) {
                throw new Error(`Equation for '${component}' must include temperature argument 'T'.`);
            }

            if (temperature != null) {
                args.T = { ...args.T, value: temperature };
                const calcArgs = this.toCalcArgs(args, component);
                const result = vaPrEq.calc(calcArgs);
                const valuePa = Number(to(result.value, `${result.unit} => Pa`));

                source[component] = {
                    value: valuePa,
                    unit: "Pa",
                };

                if (includeEquation) {
                    source[component].equation = {
                        cal: (argMap: Record<string, unknown>) =>
                            vaPrEq.calc(this.toCalcArgs(argMap as ArgInputMap, component)),
                    };
                    source[component].args = args;
                    source[component].return = vaPrEq.configReturn;
                }
            } else {
                source[component] = {
                    value: vaPrEq,
                    equation: {
                        cal: (argMap: Record<string, unknown>) =>
                            vaPrEq.calc(this.toCalcArgs(argMap as ArgInputMap, component)),
                    },
                    args,
                    return: vaPrEq.configReturn,
                };
            }
        }

        return source;
    }

    private validateInputs(inputs: Record<string, any>, requiredKeys: string[]): void {
        if (typeof inputs !== "object" || inputs == null) {
            throw new Error("Inputs must be a dictionary.");
        }

        for (const key of requiredKeys) {
            if (!(key in inputs)) {
                throw new Error(`Inputs must contain '${requiredKeys.join("', '")}' keys.`);
            }
        }
    }

    private formatError(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    private toCalcArgs(args: ArgInputMap, component: string): ArgMap<string> {
        const converted: ArgMap<string> = {};

        for (const [key, arg] of Object.entries(args)) {
            if (!arg || typeof arg.value !== "number") {
                throw new Error(
                    `Missing numeric argument value for '${key}' in component '${component}'.`
                );
            }

            converted[key] = {
                value: arg.value,
                unit: arg.unit,
                symbol: arg.symbol,
            };
        }

        return converted;
    }

    private static normalizeModelSource(modelSource: ModelSourceInput): {
        datasource: Record<string, unknown>;
        equationsource: Record<string, unknown>;
    } {
        if (!modelSource) {
            return { datasource: {}, equationsource: {} };
        }

        const maybeLegacy = modelSource as ModelSourceLegacy;
        if (maybeLegacy.datasource || maybeLegacy.equationsource) {
            return {
                datasource: (maybeLegacy.datasource ?? {}) as Record<string, unknown>,
                equationsource: (maybeLegacy.equationsource ?? {}) as Record<string, unknown>,
            };
        }

        const maybeModern = modelSource as ModelSource;
        return {
            datasource: (maybeModern.dataSource ?? {}) as Record<string, unknown>,
            equationsource: (maybeModern.equationSource ?? {}) as Record<string, unknown>,
        };
    }
}
