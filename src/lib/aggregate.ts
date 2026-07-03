import { xirr } from "./xirr";
import type { Holding } from "./types";

export type GroupTotals = {
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number | null;
  xirr: number | null;
};

export function computeGroupTotals(holdings: Holding[]): GroupTotals {
  const totalInvested = holdings.reduce((s, h) => s + h.totalInvested, 0);
  const currentValue = holdings.reduce((s, h) => s + (h.currentValue ?? 0), 0);
  const gainLoss = currentValue - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : null;

  const cashflows: { date: Date; amount: number }[] = [];
  const today = new Date();
  for (const h of holdings) {
    for (const inv of h.investments) {
      cashflows.push({ date: new Date(inv.date), amount: -inv.amount });
    }
    if (h.currentValue !== null) {
      cashflows.push({ date: today, amount: h.currentValue });
    }
  }

  return {
    totalInvested,
    currentValue,
    gainLoss,
    gainLossPct,
    xirr: xirr(cashflows),
  };
}
