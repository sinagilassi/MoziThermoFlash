import { to } from "mozicuc";
import { Activity, type ActivityFactory } from "./activity";
import { solveRachfordRice } from "../solvers/rachford-rice";
import { solveSecant } from "../solvers/secant";

type MoleFractionMap = Record<string, number>;
type VaporPressureEntry = {
    value?: number;
    unit?: string;
    equation?: { cal: (args: Record<string, unknown>) => { value: number; unit: string } };
    args?: Record<string, unknown>;
};

type EquilibriumModel = "raoult" | "modified-raoult";
type ActivityModel = "NRTL" | "UNIQUAC" | null;

type EquilibriaOptions = {
    datasource?: Record<string, unknown> | null;
    equationsource?: Record<string, unknown> | null;
    activityFactory?: ActivityFactory;
};

type NumericArrayLike = number[];

const EPS = 1e-12;

function sum(values: number[]): number {
    return values.reduce((acc, value) => acc + value, 0);
}

function dot(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("dot(): vector size mismatch");
    }
    let acc = 0;
    for (let i = 0; i < a.length; i += 1) {
        acc += a[i] * b[i];
    }
    return acc;
}

function normalize(values: number[]): number[] {
    const s = sum(values);
    if (Math.abs(s) < EPS) {
        throw new Error("Cannot normalize zero-sum vector.");
    }
    return values.map((value) => value / s);
}

export class Equilibria {
    private readonly _components: string[];
    private readonly _compNum: number;
    private readonly _datasource?: Record<string, unknown> | null;
    private readonly _equationsource?: Record<string, unknown> | null;
    private readonly activity: Activity;

    constructor(components: string[], options: EquilibriaOptions = {}) {
        this._components = components.map((component) => component.trim());
        this._compNum = this._components.length;
        this._datasource = options.datasource ?? null;
        this._equationsource = options.equationsource ?? null;

        this.activity = new Activity({
            datasource: this._datasource,
            equationsource: this._equationsource,
            activityFactory: options.activityFactory,
        });
    }

    public toString(): string {
        return "Phase Equilibria Calculations";
    }

    public get components(): string[] {
        return this._components;
    }

    public get component_num(): number {
        return this._compNum;
    }

    public set_calculated_activity_coefficient(
        acCoInput: Record<string, number> | number[]
    ): number[] {
        if (Array.isArray(acCoInput)) {
            return acCoInput.map((value) => Number(value));
        }

        const activityCoefficients = new Array<number>(this._compNum).fill(1);
        for (let i = 0; i < this._compNum; i += 1) {
            const component = this._components[i];
            const value = acCoInput[component];
            if (typeof value !== "number") {
                throw new Error(`activity_coefficients for ${component} not found.`);
            }
            activityCoefficients[i] = value;
        }

        return activityCoefficients;
    }

    public _BP(params: Record<string, any>, kwargs: Record<string, any> = {}): Record<string, any> {
        try {
            const z = (params.mole_fraction as NumericArrayLike).map(Number);
            const temperature = Number(params.temperature?.value);
            const activityModel = (params.activity_model ?? null) as ActivityModel;
            const vaporPressureMap = params.vapor_pressure as Record<string, VaporPressureEntry>;

            const zComp = this.moleFractionComp(z);
            const acCo = this.checkActivityCoefficients(activityModel, zComp, temperature, kwargs);

            const vaporPressure = this._components.map((component) => {
                const value = vaporPressureMap[component]?.value;
                if (typeof value !== "number") {
                    throw new Error(`Missing vapor pressure value for component '${component}'.`);
                }
                return value;
            });

            const bubblePressure = sum(z.map((zi, i) => zi * acCo[i] * vaporPressure[i]));
            const y = z.map((zi, i) => (zi * vaporPressure[i] * acCo[i]) / bubblePressure);
            const kRatio = y.map((yi, i) => yi / Math.max(z[i], EPS));

            return {
                bubble_pressure: { value: bubblePressure, unit: "Pa" },
                temperature: { value: temperature, unit: "K" },
                feed_mole_fraction: z,
                vapor_mole_fraction: y,
                liquid_mole_fraction: z,
                mole_fraction_sum: {
                    zi: sum(z),
                    xi: sum(z),
                    yi: sum(y),
                },
                vapor_pressure: { value: vaporPressure, unit: "Pa" },
                activity_coefficient: { value: acCo, unit: "dimensionless" },
                K_ratio: { value: kRatio, unit: "dimensionless" },
            };
        } catch (error) {
            throw new Error(`bubble pressure calculation failed! ${this.errorMessage(error)}`);
        }
    }

    public _DP(params: Record<string, any>, kwargs: Record<string, any> = {}): Record<string, any> {
        try {
            const y = (params.mole_fraction as NumericArrayLike).map(Number);
            const temperature = Number(params.temperature?.value);
            const equilibriumModel = params.equilibrium_model as EquilibriumModel;
            const activityModel = (params.activity_model ?? null) as ActivityModel;
            const vaporPressureMap = params.vapor_pressure as Record<string, VaporPressureEntry>;

            const maxIter = Number(kwargs.max_iter ?? 500);
            const tolerance = Number(kwargs.tolerance ?? 1e-6);

            let acCo = new Array<number>(this._compNum).fill(1);
            let vaporPressure = new Array<number>(this._compNum).fill(0);
            let x = [...y];
            let dewPressure = 0;
            let iteration = 0;

            if (equilibriumModel === "raoult") {
                vaporPressure = this._components.map((component) => {
                    const value = vaporPressureMap[component]?.value;
                    if (typeof value !== "number") {
                        throw new Error(`Missing vapor pressure value for component '${component}'.`);
                    }
                    return value;
                });

                dewPressure = 1 / dot(y, vaporPressure.map((value, i) => 1 / (value * acCo[i])));
                x = y.map((yi, i) => (yi * dewPressure) / (vaporPressure[i] * acCo[i]));
            } else {
                vaporPressure = this.computeVaporPressureAtTemperature(vaporPressureMap, temperature);
                dewPressure = 1 / dot(y, vaporPressure.map((value, i) => 1 / (value * acCo[i])));

                let xComp = this.moleFractionComp(x);
                for (iteration = 0; iteration < maxIter; iteration += 1) {
                    acCo = this.checkActivityCoefficients(activityModel, xComp, temperature, kwargs);

                    const newDewPressure =
                        1 / dot(y, vaporPressure.map((value, i) => 1 / (value * acCo[i])));

                    const xRaw = y.map(
                        (yi, i) => (yi * newDewPressure) / (vaporPressure[i] * Math.max(acCo[i], EPS))
                    );
                    const xNew = normalize(xRaw);

                    const xConverged = x.every(
                        (value, i) => Math.abs(value - xNew[i]) < tolerance
                    );
                    const pConverged = Math.abs(dewPressure - newDewPressure) < tolerance;

                    x = xNew;
                    xComp = this.moleFractionComp(x);
                    dewPressure = newDewPressure;

                    if (xConverged && pConverged) {
                        break;
                    }
                }
            }

            const kRatio = y.map((yi, i) => yi / Math.max(x[i], EPS));

            return {
                dew_pressure: { value: dewPressure, unit: "Pa" },
                temperature: { value: temperature, unit: "K" },
                feed_mole_fraction: y,
                vapor_mole_fraction: y,
                liquid_mole_fraction: x,
                mole_fraction_sum: {
                    zi: sum(y),
                    xi: sum(x),
                    yi: sum(y),
                },
                vapor_pressure: { value: vaporPressure, unit: "Pa" },
                activity_coefficient: { value: acCo, unit: "dimensionless" },
                K_ratio: { value: kRatio, unit: "dimensionless" },
                max_iter: maxIter,
                iteration,
                tolerance,
            };
        } catch (error) {
            throw new Error(`dew pressure calculation failed! ${this.errorMessage(error)}`);
        }
    }

    public _BT(params: Record<string, any>, kwargs: Record<string, any> = {}): Record<string, any> {
        try {
            const x = (params.mole_fraction as number[]).map(Number);
            const pressure = Number(params.pressure?.value);
            const activityModel = (params.activity_model ?? null) as ActivityModel;
            const vaporPressureMap = params.vapor_pressure as Record<string, VaporPressureEntry>;

            const guessTemperature = Number(kwargs.guess_temperature ?? 295);
            const objective = (temperature: number): number => {
                const vaporPressure = this.computeVaporPressureAtTemperature(vaporPressureMap, temperature);
                const acCo = this.checkActivityCoefficients(
                    activityModel,
                    this.moleFractionComp(x),
                    temperature,
                    kwargs
                );

                const f =
                    sum(x.map((xi, i) => (xi * vaporPressure[i] * acCo[i]) / Math.max(pressure, EPS))) - 1;
                return f;
            };

            const temperature = solveSecant(objective, guessTemperature, guessTemperature + 2);

            const vaporPressure = this.computeVaporPressureAtTemperature(vaporPressureMap, temperature);
            const acCo = this.checkActivityCoefficients(
                activityModel,
                this.moleFractionComp(x),
                temperature,
                kwargs
            );
            const y = x.map(
                (xi, i) => (xi * vaporPressure[i] * acCo[i]) / Math.max(pressure, EPS)
            );
            const yNorm = normalize(y);
            const kRatio = yNorm.map((yi, i) => yi / Math.max(x[i], EPS));

            return {
                bubble_temperature: { value: temperature, unit: "K" },
                pressure: { value: pressure, unit: "Pa" },
                feed_mole_fraction: x,
                liquid_mole_fraction: x,
                vapor_mole_fraction: yNorm,
                mole_fraction_sum: {
                    zi: sum(x),
                    xi: sum(x),
                    yi: sum(yNorm),
                },
                vapor_pressure: { value: vaporPressure, unit: "Pa" },
                K_ratio: { value: kRatio, unit: "dimensionless" },
                activity_coefficient: { value: acCo, unit: "dimensionless" },
            };
        } catch (error) {
            throw new Error(`bubble temperature calculation failed! ${this.errorMessage(error)}`);
        }
    }

    public _DT(params: Record<string, any>, kwargs: Record<string, any> = {}): Record<string, any> {
        try {
            const y = (params.mole_fraction as number[]).map(Number);
            const pressure = Number(params.pressure?.value);
            const equilibriumModel = params.equilibrium_model as EquilibriumModel;
            const activityModel = (params.activity_model ?? null) as ActivityModel;
            const vaporPressureMap = params.vapor_pressure as Record<string, VaporPressureEntry>;

            const maxIter = Number(kwargs.max_iter ?? 300);
            const tolerance = Number(kwargs.tolerance ?? 1e-6);
            const guessTemperature = Number(kwargs.guess_temperature ?? 295);

            let finalXi = [...y];
            let finalAcCo = new Array<number>(this._compNum).fill(1);
            let finalVaporPressure = new Array<number>(this._compNum).fill(0);

            const objective = (temperature: number): number => {
                const vaporPressure = this.computeVaporPressureAtTemperature(vaporPressureMap, temperature);
                finalVaporPressure = vaporPressure;

                if (equilibriumModel === "raoult") {
                    const f = sum(y.map((yi, i) => (yi * pressure) / Math.max(vaporPressure[i], EPS))) - 1;
                    finalXi = normalize(
                        y.map((yi, i) => (yi * pressure) / Math.max(vaporPressure[i], EPS))
                    );
                    finalAcCo = new Array<number>(this._compNum).fill(1);
                    return f;
                }

                let xi = [...y];
                let acCo = [...finalAcCo];
                let xRaw = [...xi];

                for (let i = 0; i < maxIter; i += 1) {
                    const xComp = this.moleFractionComp(xi);
                    acCo = this.checkActivityCoefficients(activityModel, xComp, temperature, kwargs);

                    xRaw = y.map(
                        (yi, j) =>
                            (yi * pressure) /
                            Math.max(vaporPressure[j] * Math.max(acCo[j], EPS), EPS)
                    );

                    const xiNew = normalize(xRaw);
                    const converged = xi.every((value, j) => Math.abs(value - xiNew[j]) < tolerance);
                    xi = xiNew;
                    if (converged) {
                        break;
                    }
                }

                finalXi = xi;
                finalAcCo = acCo;

                return sum(xRaw) - 1;
            };

            const dewTemperature = solveSecant(objective, guessTemperature, guessTemperature + 2);
            const kRatio = y.map((yi, i) => yi / Math.max(finalXi[i], EPS));

            return {
                dew_temperature: { value: dewTemperature, unit: "K" },
                pressure: { value: pressure, unit: "Pa" },
                feed_mole_fraction: y,
                vapor_mole_fraction: y,
                liquid_mole_fraction: finalXi,
                mole_fraction_sum: {
                    zi: sum(y),
                    yi: sum(y),
                    xi: sum(finalXi),
                },
                vapor_pressure: { value: finalVaporPressure, unit: "Pa" },
                K_ratio: { value: kRatio, unit: "dimensionless" },
                activity_coefficient: { value: finalAcCo, unit: "dimensionless" },
            };
        } catch (error) {
            throw new Error(`dew temperature calculation failed! ${this.errorMessage(error)}`);
        }
    }

    public _flash_checker(input: {
        z_i: number[];
        Pf: number;
        Tf: number;
        VaPr_comp: Record<string, VaporPressureEntry>;
    }): boolean {
        const vaporPressure = this.computeVaporPressureAtTemperature(input.VaPr_comp, input.Tf);
        const bubblePressure = this.calBubblePressure(input.z_i, vaporPressure);
        const dewPressure = this.calDewPressure(input.z_i, vaporPressure);

        return bubblePressure > input.Pf && input.Pf > dewPressure;
    }

    public _IFL(params: Record<string, any>, kwargs: Record<string, any> = {}): Record<string, any> {
        try {
            const z = (params.mole_fraction as number[]).map(Number);
            const pressure = Number(params.pressure?.value);
            const temperature = Number(params.temperature?.value);
            const equilibriumModel = params.equilibrium_model as EquilibriumModel;
            const activityModel = (params.activity_model ?? null) as ActivityModel;
            const vaporPressureMap = params.vapor_pressure as Record<string, VaporPressureEntry>;

            const maxIter = Number(kwargs.max_iter ?? 300);
            const tolerance = Number(kwargs.tolerance ?? 1e-8);

            const vaporPressure = this.computeVaporPressureAtTemperature(vaporPressureMap, temperature);
            const kBase = vaporPressure.map((value) => value / Math.max(pressure, EPS));

            let acCo = new Array<number>(this._compNum).fill(1);
            let k = [...kBase];
            let beta = solveRachfordRice(z, k);

            if (equilibriumModel === "modified-raoult") {
                for (let iter = 0; iter < maxIter; iter += 1) {
                    beta = solveRachfordRice(z, k);
                    const xRaw = z.map((zi, i) => zi / Math.max(1 + beta * (k[i] - 1), EPS));
                    const x = normalize(xRaw);
                    const xComp = this.moleFractionComp(x);
                    const acNew = this.checkActivityCoefficients(
                        activityModel,
                        xComp,
                        temperature,
                        kwargs
                    );
                    const kNew = kBase.map((value, i) => value * acNew[i]);

                    const converged = k.every((value, i) => Math.abs(value - kNew[i]) < tolerance);
                    k = kNew;
                    acCo = acNew;
                    if (converged) {
                        break;
                    }
                }
            }

            beta = solveRachfordRice(z, k);
            const xy = this.xy_flash(beta, z, k, null);
            const x = xy.liquid;
            const y = xy.vapor;

            if (equilibriumModel === "modified-raoult") {
                acCo = this.checkActivityCoefficients(
                    activityModel,
                    this.moleFractionComp(x),
                    temperature,
                    kwargs
                );
            }

            return {
                V_F_ratio: { value: beta, unit: "dimensionless", symbol: "V/F" },
                L_F_ratio: { value: 1 - beta, unit: "dimensionless", symbol: "L/F" },
                feed_mole_fraction: z,
                liquid_mole_fraction: x,
                vapor_mole_fraction: y,
                mole_fraction_sum: {
                    zi: sum(z),
                    xi: sum(x),
                    yi: sum(y),
                },
                vapor_pressure: { value: vaporPressure, unit: "Pa", symbol: "VaPr" },
                K_ratio: { value: k, unit: "dimensionless", symbol: "Kxy" },
                temperature: { value: temperature, unit: "K", symbol: "T" },
                pressure: { value: pressure, unit: "Pa", symbol: "P" },
                activity_coefficient: {
                    value: acCo,
                    unit: "dimensionless",
                    symbol: "AcCo",
                },
                solver_message: "Rachford-Rice convergence achieved.",
            };
        } catch (error) {
            throw new Error(`flash isothermal failed! ${this.errorMessage(error)}`);
        }
    }

    public xy_flash(
        vF_ratio: number,
        z: number[],
        kRatio: number[],
        acCo: number[] | null = null
    ): { liquid: number[]; vapor: number[] } {
        try {
            const gamma = acCo ?? new Array<number>(this._compNum).fill(1);
            const x = new Array<number>(this._compNum).fill(0);
            const y = new Array<number>(this._compNum).fill(0);

            for (let i = 0; i < this._compNum; i += 1) {
                x[i] = z[i] / Math.max(1 + vF_ratio * (kRatio[i] * gamma[i] - 1), EPS);
                y[i] = kRatio[i] * gamma[i] * x[i];
            }

            return {
                liquid: x,
                vapor: y,
            };
        } catch (error) {
            throw new Error(`Error in xy_flash calculation: ${this.errorMessage(error)}`);
        }
    }

    private moleFractionComp(z: number[]): MoleFractionMap {
        const res: MoleFractionMap = {};
        for (let i = 0; i < this._compNum; i += 1) {
            res[this._components[i]] = z[i];
        }
        return res;
    }

    private activityCoefficient(
        activityModel: ActivityModel,
        xComp: MoleFractionMap,
        temperature: number,
        kwargs: Record<string, any>
    ): number[] {
        if (activityModel === "NRTL") {
            const res = this.activity.NRTL(this._components, xComp, temperature, kwargs);
            return this.normalizeActivityValue((res as Record<string, unknown>).value, "NRTL");
        }
        if (activityModel === "UNIQUAC") {
            const res = this.activity.UNIQUAC(this._components, xComp, temperature, kwargs);
            return this.normalizeActivityValue((res as Record<string, unknown>).value, "UNIQUAC");
        }
        return new Array<number>(this._compNum).fill(1);
    }

    private normalizeActivityValue(
        value: unknown,
        model: "NRTL" | "UNIQUAC"
    ): number[] {
        if (Array.isArray(value)) {
            return value.map((item) => Number(item));
        }
        if (value && typeof value === "object") {
            return this.set_calculated_activity_coefficient(value as Record<string, number>);
        }
        throw new Error(
            `Invalid activity coefficient output from ${model}. Expected number[] or component-keyed object.`
        );
    }

    private checkActivityCoefficients(
        activityModel: ActivityModel,
        xComp: MoleFractionMap,
        temperature: number,
        kwargs: Record<string, any>
    ): number[] {
        const external = kwargs.activity_coefficients;
        if (external != null) {
            return this.set_calculated_activity_coefficient(external as Record<string, number> | number[]);
        }
        return this.activityCoefficient(activityModel, xComp, temperature, kwargs);
    }

    private computeVaporPressureAtTemperature(
        vaporPressureMap: Record<string, VaporPressureEntry>,
        temperature: number
    ): number[] {
        return this._components.map((component) => {
            const entry = vaporPressureMap[component];
            if (!entry) {
                throw new Error(`Missing vapor pressure source for component '${component}'.`);
            }

            if (typeof entry.value === "number" && !entry.equation) {
                return entry.value;
            }

            if (!entry.equation) {
                throw new Error(`Missing vapor pressure equation for component '${component}'.`);
            }

            const baseArgs = { ...(entry.args ?? {}) } as Record<string, unknown>;
            const tSource = baseArgs.T as
                | { value?: unknown; unit?: unknown; symbol?: unknown }
                | undefined;
            const tArg =
                tSource && typeof tSource === "object"
                    ? {
                          ...tSource,
                          value: temperature,
                      }
                    : {
                          value: temperature,
                          unit: "K",
                          symbol: "T",
                      };
            const args = { ...baseArgs, T: tArg };
            const res = entry.equation.cal(args);
            const unitBlock = `${res.unit} => Pa`;
            return Number(to(res.value, unitBlock));
        });
    }

    private calBubblePressure(x: number[], vaporPressure: number[]): number {
        return sum(x.map((xi, i) => xi * vaporPressure[i]));
    }

    private calDewPressure(y: number[], vaporPressure: number[]): number {
        const denominator = sum(y.map((yi, i) => yi / Math.max(vaporPressure[i], EPS)));
        return 1 / Math.max(denominator, EPS);
    }

    private errorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
