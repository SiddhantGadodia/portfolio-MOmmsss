"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryCards } from "@/components/summary-cards";
import { HoldingCard } from "@/components/holding-card";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { UserMenu } from "@/components/user-menu";
import { computeGroupTotals } from "@/lib/aggregate";
import { formatXirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Holding } from "@/lib/types";

export function PortfolioDashboard() {
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHoldings = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/holdings");
      const data = await res.json();
      setHoldings(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const mfHoldings = useMemo(() => holdings?.filter((h) => h.type === "MF") ?? [], [holdings]);
  const stockHoldings = useMemo(() => holdings?.filter((h) => h.type === "STOCK") ?? [], [holdings]);

  const overallTotals = useMemo(() => computeGroupTotals(holdings ?? []), [holdings]);
  const mfTotals = useMemo(() => computeGroupTotals(mfHoldings), [mfHoldings]);
  const stockTotals = useMemo(() => computeGroupTotals(stockHoldings), [stockHoldings]);

  if (holdings === null) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your portfolio…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <LineChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Portfolio XIRR Tracker</h1>
            <p className="text-xs text-muted-foreground">Mutual funds &amp; equity shares, all in one place</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <UserMenu />
        </div>
      </div>

      <SummaryCards totals={overallTotals} />

      <Tabs defaultValue="mf" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="mf">Mutual Funds ({mfHoldings.length})</TabsTrigger>
            <TabsTrigger value="stocks">Equity Shares ({stockHoldings.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mf" className="space-y-4">
          <CategoryHeader
            label="Mutual Funds"
            totals={mfTotals}
            action={<AddHoldingDialog type="MF" onAdded={fetchHoldings} />}
          />
          {mfHoldings.length === 0 ? (
            <EmptyState label="No mutual funds added yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {mfHoldings.map((h) => (
                <HoldingCard key={h.id} holding={h} onChanged={fetchHoldings} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stocks" className="space-y-4">
          <CategoryHeader
            label="Equity Shares"
            totals={stockTotals}
            action={<AddHoldingDialog type="STOCK" onAdded={fetchHoldings} />}
          />
          {stockHoldings.length === 0 ? (
            <EmptyState label="No equity shares added yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {stockHoldings.map((h) => (
                <HoldingCard key={h.id} holding={h} onChanged={fetchHoldings} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryHeader({
  label,
  totals,
  action,
}: {
  label: string;
  totals: ReturnType<typeof computeGroupTotals>;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">{label} XIRR</span>
        <span
          className={cn(
            "text-base font-semibold",
            totals.xirr === null ? "text-muted-foreground" : totals.xirr >= 0 ? "text-success" : "text-danger"
          )}
        >
          {formatXirr(totals.xirr)}
        </span>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border/60">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
