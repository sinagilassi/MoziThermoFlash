import { solveBisection } from "./bisection";

const EPS = 1e-12;

export type RachfordRiceOptions = {
    maxIter?: number;
    tolerance?: number;
    epsilon?: number;
};

export function solveRachfordRice(
    z: number[],
    k: number[],
    options: RachfordRiceOptions = {}
): number {
    if (z.length !== k.length) {
        throw new Error("Rachford-Rice inputs must have the same length.");
    }

    const maxIter = options.maxIter ?? 200;
    const tolerance = options.tolerance ?? 1e-10;
    const epsilon = options.epsilon ?? EPS;

    const f = (beta: number): number => {
        let acc = 0;
        for (let i = 0; i < z.length; i += 1) {
            const term = 1 + beta * (k[i] - 1);
            acc += (z[i] * (k[i] - 1)) / Math.max(term, epsilon);
        }
        return acc;
    };

    const f0 = f(0);
    const f1 = f(1);

    if (f0 < 0) {
        return 0;
    }
    if (f1 > 0) {
        return 1;
    }

    return solveBisection(f, 0, 1, { maxIter, tolerance });
}
