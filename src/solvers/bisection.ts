export type ScalarFunction = (x: number) => number;

export type BisectionOptions = {
    maxIter?: number;
    tolerance?: number;
};

export function solveBisection(
    fn: ScalarFunction,
    lower: number,
    upper: number,
    options: BisectionOptions = {}
): number {
    const maxIter = options.maxIter ?? 200;
    const tolerance = options.tolerance ?? 1e-10;

    let low = lower;
    let high = upper;
    let fLow = fn(low);
    const fHigh = fn(high);

    if (Math.abs(fLow) < tolerance) {
        return low;
    }
    if (Math.abs(fHigh) < tolerance) {
        return high;
    }
    if (fLow * fHigh > 0) {
        throw new Error("Bisection requires a sign-changing bracket.");
    }

    for (let i = 0; i < maxIter; i += 1) {
        const mid = 0.5 * (low + high);
        const fMid = fn(mid);

        if (Math.abs(fMid) < tolerance || Math.abs(high - low) < tolerance) {
            return mid;
        }

        if (fLow * fMid > 0) {
            low = mid;
            fLow = fMid;
        } else {
            high = mid;
        }
    }

    return 0.5 * (low + high);
}
