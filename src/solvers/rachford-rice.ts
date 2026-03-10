const EPS = 1e-12;

export type FlashPhase = "L" | "V" | "VL";

export type RachfordRiceOptions = {
    maxIter?: number;
    tolerance?: number;
    epsilon?: number;
};

export type RachfordRiceResult = {
    beta: number;
    phase: FlashPhase;
    iterations: number;
    f0: number;
    f1: number;
    residual: number;
    converged: boolean;
};

export function solveRachfordRice(
    z: number[],
    k: number[],
    options: RachfordRiceOptions = {}
): RachfordRiceResult {
    if (z.length !== k.length) {
        throw new Error("Rachford-Rice inputs must have the same length.");
    }

    const maxIter = options.maxIter ?? 200;
    const tolerance = options.tolerance ?? 1e-10;
    const epsilon = options.epsilon ?? EPS;

    const f = (beta: number): number => {
        let acc = 0;
        for (let i = 0; i < z.length; i += 1) {
            const ki = k[i];
            if (!Number.isFinite(ki) || ki <= 0) {
                throw new Error(`Invalid K-value at index ${i}. K must be finite and > 0.`);
            }
            const term = 1 + beta * (ki - 1);
            if (term <= epsilon) {
                throw new Error(`Invalid Rachford-Rice denominator at beta=${beta}, index=${i}.`);
            }
            acc += (z[i] * (ki - 1)) / term;
        }
        return acc;
    };

    const f0 = f(0);
    const f1 = f(1);

    if (f0 < -tolerance && f1 < -tolerance) {
        return {
            beta: 0,
            phase: "L",
            iterations: 0,
            f0,
            f1,
            residual: Math.abs(f0),
            converged: true,
        };
    }
    if (f0 > tolerance && f1 > tolerance) {
        return {
            beta: 1,
            phase: "V",
            iterations: 0,
            f0,
            f1,
            residual: Math.abs(f1),
            converged: true,
        };
    }
    if (Math.abs(f0) <= tolerance) {
        return {
            beta: 0,
            phase: "VL",
            iterations: 0,
            f0,
            f1,
            residual: Math.abs(f0),
            converged: true,
        };
    }
    if (Math.abs(f1) <= tolerance) {
        return {
            beta: 1,
            phase: "VL",
            iterations: 0,
            f0,
            f1,
            residual: Math.abs(f1),
            converged: true,
        };
    }

    let low = 0;
    let high = 1;
    let fLow = f0;
    const fHighInitial = f1;

    if (fLow * fHighInitial > 0) {
        throw new Error("Rachford-Rice root is not bracketed in [0, 1].");
    }

    let beta = 0.5;
    let residual = Number.POSITIVE_INFINITY;
    let converged = false;

    for (let iter = 1; iter <= maxIter; iter += 1) {
        beta = 0.5 * (low + high);
        const fMid = f(beta);
        residual = Math.abs(fMid);

        if (residual <= tolerance || Math.abs(high - low) <= tolerance) {
            converged = true;
            return {
                beta,
                phase: "VL",
                iterations: iter,
                f0,
                f1,
                residual,
                converged,
            };
        }

        if (fLow * fMid > 0) {
            low = beta;
            fLow = fMid;
        } else {
            high = beta;
        }
    }

    return {
        beta,
        phase: "VL",
        iterations: maxIter,
        f0,
        f1,
        residual,
        converged,
    };
}
