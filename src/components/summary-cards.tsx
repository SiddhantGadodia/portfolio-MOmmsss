import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent, formatXirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import type { GroupTotals } from "@/lib/aggregate";

export function SummaryCards({ totals }: { totals: GroupTotals }) {
  const isGain = totals.gainLoss >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-semibold tracking-tight">
            {formatCurrency(totals.totalInvested)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-semibold tracking-tight">
            {formatCurrency(totals.currentValue)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Gain / Loss</CardTitle>
          {isGain ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn("text-xl md:text-2xl font-semibold tracking-tight", isGain ? "text-success" : "text-danger")}>
            {formatCurrency(totals.gainLoss)}
          </div>
          <p className={cn("text-xs mt-0.5", isGain ? "text-success" : "text-danger")}>
            {formatPercent(totals.gainLossPct)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overall XIRR</CardTitle>
          {(totals.xirr ?? 0) >= 0 ? (
            <TrendingUp className="h-4 w-4 text-primary" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-xl md:text-2xl font-semibold tracking-tight",
              totals.xirr === null ? "text-muted-foreground" : totals.xirr >= 0 ? "text-primary" : "text-danger"
            )}
          >
            {formatXirr(totals.xirr)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
