export type Cashflow = { date: Date; amount: number };

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function npv(rate: number, cashflows: Cashflow[], t0: Date): number {
  return cashflows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0.getTime()) / MS_PER_DAY / 365;
    return sum + cf.amount / Math.pow(1 + rate, years);
  }, 0);
}

function npvDerivative(rate: number, cashflows: Cashflow[], t0: Date): number {
  return cashflows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0.getTime()) / MS_PER_DAY / 365;
    if (years === 0) return sum;
    return sum - (years * cf.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

/**
 * Computes XIRR (annualized) for a set of dated cashflows.
 * Investments should be negative, redemptions/current value positive.
 * Returns null if it doesn't converge or inputs are degenerate.
 */
export function xirr(cashflows: Cashflow[]): number | null {
  if (cashflows.length < 2) return null;

  const hasPositive = cashflows.some((cf) => cf.amount > 0);
  const hasNegative = cashflows.some((cf) => cf.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date;

  let rate = 0.1;
  const maxIterations = 100;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    const f = npv(rate, sorted, t0);
    const df = npvDerivative(rate, sorted, t0);
    if (Math.abs(df) < 1e-12) break;

    const newRate = rate - f / df;
    if (!isFinite(newRate)) break;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    rate = newRate;
    if (rate <= -0.9999) rate = -0.9999;
  }

  // Newton-Raphson failed to converge; fall back to bisection over a wide range.
  return xirrBisection(sorted, t0);
}

function xirrBisection(cashflows: Cashflow[], t0: Date): number | null {
  let low = -0.9999;
  let high = 10;
  let fLow = npv(low, cashflows, t0);
  let fHigh = npv(high, cashflows, t0);

  if (isNaN(fLow) || isNaN(fHigh) || fLow * fHigh > 0) return null;

  let mid = 0;
  for (let i = 0; i < 200; i++) {
    mid = (low + high) / 2;
    const fMid = npv(mid, cashflows, t0);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return mid;
}
