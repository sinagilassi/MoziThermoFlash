const DEFAULT_EPSILON = 1e-12;

export type ScalarFunction = (x: number) => number;

export type SecantOptions = {
    maxIter?: number;
    tolerance?: number;
    epsilon?: number;
};

export function solveSecant(
    fn: ScalarFunction,
    x0: number,
    x1: number,
    options: SecantOptions = {}
): number {
    const maxIter = options.maxIter ?? 200;
    const tolerance = options.tolerance ?? 1e-8;
    const epsilon = options.epsilon ?? DEFAULT_EPSILON;

    let f0 = fn(x0);
    let f1 = fn(x1);

    for (let i = 0; i < maxIter; i += 1) {
        const denom = f1 - f0;
        if (Math.abs(denom) < epsilon) {
            return x1;
        }

        const x2 = x1 - (f1 * (x1 - x0)) / denom;
        const f2 = fn(x2);

        if (Math.abs(f2) < tolerance || Math.abs(x2 - x1) < tolerance) {
            return x2;
        }

        x0 = x1;
        f0 = f1;
        x1 = x2;
        f1 = f2;
    }

    return x1;
}
