export type HoldingType = "MF" | "STOCK";

export type Investment = {
  id: number;
  date: string;
  units: number;
  price: number;
  amount: number;
};

export type Holding = {
  id: number;
  type: HoldingType;
  name: string;
  code: string;
  investments: Investment[];
  totalUnits: number;
  totalInvested: number;
  currentPrice: number | null;
  currentPriceDate: string | null;
  currentValue: number | null;
  gainLoss: number | null;
  gainLossPct: number | null;
  xirr: number | null;
};
