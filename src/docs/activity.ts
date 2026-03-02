import { MoziMatrixData } from "mozithermodb";
import type { Component } from "mozithermodb-settings";

export type NumericMatrix = number[][];
export type MatrixSource = MoziMatrixData | NumericMatrix;
export type MoleFractionMap = Record<string, number>;

type ActivityInputs = Record<string, unknown>;

type NrtlModel = {
    cal_tau_ij_M1(input: { temperature: number; dg_ij: NumericMatrix }): unknown;
    cal_tau_ij_M2(input: {
        temperature: number;
        a_ij: NumericMatrix;
        b_ij: NumericMatrix;
        c_ij: NumericMatrix;
        d_ij: NumericMatrix;
    }): unknown;
    cal(input: { model_input: Record<string, unknown> }): unknown;
};

type UniquacModel = {
    cal_tau_ij_M1(input: { temperature: number; dU_ij: NumericMatrix }): unknown;
    cal_tau_ij_M2(input: {
        temperature: number;
        a_ij: NumericMatrix;
        b_ij: NumericMatrix;
        c_ij: NumericMatrix;
        d_ij: NumericMatrix;
    }): unknown;
    cal(input: { model_input: Record<string, unknown> }): unknown;
};

type ActivityRuntime = {
    nrtl?: NrtlModel | null;
    uniquac?: UniquacModel | null;
};

export type ActivityFactory = (input: {
    components: string[];
    modelName: "NRTL" | "UNIQUAC";
}) => ActivityRuntime;

export interface ActivityOptions {
    datasource?: Record<string, unknown> | null;
    equationsource?: Record<string, unknown> | null;
    activityFactory?: ActivityFactory;
}

export interface NrtlOptions {
    activity_inputs?: ActivityInputs;
    NRTL?: ActivityInputs;
    activityFactory?: ActivityFactory;
}

export interface UniquacOptions {
    activity_inputs?: ActivityInputs;
    UNIQUAC?: ActivityInputs;
    activityFactory?: ActivityFactory;
}

export class Activity {
    public datasource?: Record<string, unknown> | null;
    public equationsource?: Record<string, unknown> | null;

    private readonly activityFactory?: ActivityFactory;

    constructor(options: ActivityOptions = {}) {
        this.datasource = options.datasource ?? null;
        this.equationsource = options.equationsource ?? null;
        this.activityFactory = options.activityFactory;
    }

    public toString(): string {
        return "Activity model class for pyThermoFlash";
    }

    public NRTL(
        components: string[],
        z_i_comp: MoleFractionMap,
        temperature: number,
        options: NrtlOptions = {}
    ): Record<string, unknown> {
        try {
            const activityInputs = this.resolveActivityInputs(
                options.activity_inputs,
                options.NRTL,
                "NRTL"
            );

            const dg_ij_src = activityInputs.dg_ij ?? activityInputs.dg;
            const a_ij_src = activityInputs.a_ij ?? activityInputs.a;
            const b_ij_src = activityInputs.b_ij ?? activityInputs.b;
            const c_ij_src = activityInputs.c_ij ?? activityInputs.c;
            const d_ij_src = activityInputs.d_ij ?? activityInputs.d;
            const alpha_ij_src = activityInputs.alpha_ij ?? activityInputs.alpha;

            const activity = this.buildActivityModel(
                components,
                "NRTL",
                options.activityFactory
            );
            const activityNrtl = activity.nrtl;
            if (!activityNrtl) {
                throw new Error(
                    "Failed to initialize NRTL activity model. Please check the components and model name."
                );
            }

            let tau_ij: NumericMatrix;

            if (dg_ij_src == null) {
                if (
                    a_ij_src == null ||
                    b_ij_src == null ||
                    c_ij_src == null ||
                    d_ij_src == null
                ) {
                    throw new Error(
                        "No valid source provided for interaction energy parameter (dg_ij) or constants a, b, c, and d."
                    );
                }

                const a_ij = this.resolveMatrixSource(a_ij_src, "a", components);
                const b_ij = this.resolveMatrixSource(b_ij_src, "b", components);
                const c_ij = this.resolveMatrixSource(c_ij_src, "c", components);
                const d_ij = this.resolveMatrixSource(d_ij_src, "d", components);

                tau_ij = Activity.extractFirst<NumericMatrix>(
                    activityNrtl.cal_tau_ij_M2({
                        temperature,
                        a_ij,
                        b_ij,
                        c_ij,
                        d_ij,
                    })
                );
            } else {
                const dg_ij = this.resolveMatrixSource(dg_ij_src, "dg", components);
                tau_ij = Activity.extractFirst<NumericMatrix>(
                    activityNrtl.cal_tau_ij_M1({
                        temperature,
                        dg_ij,
                    })
                );
            }

            const alpha_ij = this.resolveMatrixSource(alpha_ij_src, "alpha", components);

            const inputs = {
                mole_fraction: z_i_comp,
                tau_ij,
                alpha_ij,
            };

            const res = Activity.extractFirst<Record<string, unknown>>(
                activityNrtl.cal({ model_input: inputs })
            );

            return res;
        } catch (error) {
            throw new Error(`Failed to calculate NRTL activity: ${Activity.errorMessage(error)}`);
        }
    }

    public UNIQUAC(
        components: string[],
        z_i_comp: MoleFractionMap,
        temperature: number,
        options: UniquacOptions = {}
    ): Record<string, unknown> {
        try {
            const activityInputs = this.resolveActivityInputs(
                options.activity_inputs,
                options.UNIQUAC,
                "UNIQUAC"
            );

            const dU_ij_src = activityInputs.dU_ij ?? activityInputs.dU;
            const a_ij_src = activityInputs.a_ij ?? activityInputs.a;
            const b_ij_src = activityInputs.b_ij ?? activityInputs.b;
            const c_ij_src = activityInputs.c_ij ?? activityInputs.c;
            const d_ij_src = activityInputs.d_ij ?? activityInputs.d;

            const r_i_src = activityInputs.r_i ?? activityInputs.r;
            const q_i_src = activityInputs.q_i ?? activityInputs.q;

            const r_i = this.resolveVectorSource(r_i_src, "r_i");
            const q_i = this.resolveVectorSource(q_i_src, "q_i");

            const activity = this.buildActivityModel(
                components,
                "UNIQUAC",
                options.activityFactory
            );
            const activityUniquac = activity.uniquac;
            if (!activityUniquac) {
                throw new Error(
                    "Failed to initialize UNIQUAC activity model. Please check the components and model name."
                );
            }

            let tau_ij: NumericMatrix;

            if (dU_ij_src == null) {
                if (
                    a_ij_src == null ||
                    b_ij_src == null ||
                    c_ij_src == null ||
                    d_ij_src == null
                ) {
                    throw new Error(
                        "No valid source provided for interaction energy parameter (dU_ij) or constants a, b, c, and d."
                    );
                }

                const a_ij = this.resolveMatrixSource(a_ij_src, "a", components);
                const b_ij = this.resolveMatrixSource(b_ij_src, "b", components);
                const c_ij = this.resolveMatrixSource(c_ij_src, "c", components);
                const d_ij = this.resolveMatrixSource(d_ij_src, "d", components);

                tau_ij = Activity.extractFirst<NumericMatrix>(
                    activityUniquac.cal_tau_ij_M2({
                        temperature,
                        a_ij,
                        b_ij,
                        c_ij,
                        d_ij,
                    })
                );
            } else {
                const dU_ij = this.resolveMatrixSource(dU_ij_src, "dU", components);
                tau_ij = Activity.extractFirst<NumericMatrix>(
                    activityUniquac.cal_tau_ij_M1({
                        temperature,
                        dU_ij,
                    })
                );
            }

            const inputs = {
                mole_fraction: z_i_comp,
                tau_ij,
                r_i,
                q_i,
            };

            const res = Activity.extractFirst<Record<string, unknown>>(
                activityUniquac.cal({ model_input: inputs })
            );

            return res;
        } catch (error) {
            throw new Error(
                `Failed to calculate UNIQUAC activity: ${Activity.errorMessage(error)}`
            );
        }
    }

    private buildActivityModel(
        components: string[],
        modelName: "NRTL" | "UNIQUAC",
        methodFactory?: ActivityFactory
    ): ActivityRuntime {
        const factory = methodFactory ?? this.activityFactory;
        if (!factory) {
            throw new Error(
                "No activity factory provided. Pass `activityFactory` in constructor or method options."
            );
        }
        return factory({ components, modelName });
    }

    private resolveActivityInputs(
        methodInputs: ActivityInputs | undefined,
        modelInputs: ActivityInputs | undefined,
        modelName: "NRTL" | "UNIQUAC"
    ): ActivityInputs {
        const resolved = methodInputs ?? modelInputs;
        if (!resolved) {
            throw new Error(
                `No valid source provided for activity model (${modelName}) inputs.`
            );
        }
        if (typeof resolved !== "object" || Array.isArray(resolved)) {
            throw new Error("activity_inputs must be a dictionary/object.");
        }
        if (Object.keys(resolved).length === 0) {
            throw new Error("activity_inputs cannot be empty.");
        }

        return { ...resolved, ...(modelInputs ?? {}) };
    }

    private resolveMatrixSource(
        source: unknown,
        propertySymbol: string,
        components: string[]
    ): NumericMatrix {
        if (source instanceof MoziMatrixData) {
            return source.mat(
                propertySymbol,
                components as unknown as Component[]
            );
        }
        if (Activity.isNumericMatrix(source)) {
            return source;
        }
        throw new Error(
            `Invalid source for matrix property (${propertySymbol}). Must be MoziMatrixData or number[][].`
        );
    }

    private resolveVectorSource(source: unknown, name: string): number[] {
        if (!Array.isArray(source)) {
            throw new Error(`Invalid source for ${name}. Must be a numeric array.`);
        }
        if (!source.every((value) => typeof value === "number")) {
            throw new Error(`Invalid source for ${name}. Must be a numeric array.`);
        }
        return source;
    }

    private static extractFirst<T>(value: unknown): T {
        if (Array.isArray(value)) {
            return value[0] as T;
        }
        return value as T;
    }

    private static isNumericMatrix(value: unknown): value is NumericMatrix {
        if (!Array.isArray(value)) {
            return false;
        }
        return value.every(
            (row) =>
                Array.isArray(row) && row.every((cell) => typeof cell === "number")
        );
    }

    private static errorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
