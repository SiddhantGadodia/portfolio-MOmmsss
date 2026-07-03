"use client";

import { useState } from "react";
import { ChevronDown, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvestmentFormDialog } from "@/components/investment-form-dialog";
import { formatCurrency, formatDate, formatNumber, formatXirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Holding, Investment } from "@/lib/types";

export function HoldingCard({ holding, onChanged }: { holding: Holding; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState<number | null>(null);
  const [deleteFundOpen, setDeleteFundOpen] = useState(false);

  const isGain = (holding.gainLoss ?? 0) >= 0;
  const unitLabel = holding.type === "MF" ? "Units" : "Shares";

  async function deleteFund() {
    await fetch(`/api/holdings/${holding.id}`, { method: "DELETE" });
    setDeleteFundOpen(false);
    onChanged();
  }

  async function confirmDeleteInvestment() {
    if (deleteInvestmentId === null) return;
    await fetch(`/api/investments/${deleteInvestmentId}`, { method: "DELETE" });
    setDeleteInvestmentId(null);
    onChanged();
  }

  return (
    <>
      <Card className="border-border/60 bg-card/60 backdrop-blur transition-colors hover:border-border">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <button
              className="flex-1 text-left min-w-0"
              onClick={() => setExpanded((e) => !e)}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm leading-snug truncate">{holding.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {holding.type === "MF" ? `Scheme ${holding.code}` : holding.code} ·{" "}
                {holding.investments.length} investment{holding.investments.length !== 1 ? "s" : ""}
              </p>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingInvestment(null);
                    setInvestmentDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Investment
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onClick={() => setDeleteFundOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove {holding.type === "MF" ? "Fund" : "Stock"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                {formatCurrency(holding.currentValue)}
              </div>
              <div className={cn("text-xs mt-0.5", isGain ? "text-success" : "text-danger")}>
                {formatCurrency(holding.gainLoss)} ({holding.gainLossPct?.toFixed(2) ?? "—"}%)
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  holding.xirr === null
                    ? "text-muted-foreground"
                    : holding.xirr >= 0
                    ? "text-success border-success/30 bg-success/10"
                    : "text-danger border-danger/30 bg-danger/10"
                )}
              >
                XIRR {formatXirr(holding.xirr)}
              </Badge>
            </div>
          </div>

          <button
            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 w-full"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Hide" : "Show"} investment history
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </CardHeader>

        {expanded && (
          <CardContent className="p-4 pt-0">
            {holding.investments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No investments yet. Add one to get started.
              </p>
            ) : (
              <div className="rounded-md border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 text-xs">Date</TableHead>
                      <TableHead className="h-8 text-xs text-right">{unitLabel}</TableHead>
                      <TableHead className="h-8 text-xs text-right">Price</TableHead>
                      <TableHead className="h-8 text-xs text-right">Amount</TableHead>
                      <TableHead className="h-8 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holding.investments.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="py-2 text-xs">{formatDate(inv.date)}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{formatNumber(inv.units)}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{formatCurrency(inv.price)}</TableCell>
                        <TableCell className="py-2 text-xs text-right">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingInvestment(inv);
                                setInvestmentDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-danger hover:text-danger"
                              onClick={() => setDeleteInvestmentId(inv.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-1.5"
              onClick={() => {
                setEditingInvestment(null);
                setInvestmentDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Investment
            </Button>
          </CardContent>
        )}
      </Card>

      <InvestmentFormDialog
        open={investmentDialogOpen}
        onOpenChange={setInvestmentDialogOpen}
        holdingId={holding.id}
        unitLabel={unitLabel}
        existing={editingInvestment}
        onSaved={onChanged}
      />

      <AlertDialog open={deleteInvestmentId !== null} onOpenChange={(v) => !v && setDeleteInvestmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this investment?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the entry and recalculate XIRR.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvestment} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFundOpen} onOpenChange={setDeleteFundOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {holding.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the {holding.type === "MF" ? "fund" : "stock"} and all {holding.investments.length}{" "}
              investment{holding.investments.length !== 1 ? "s" : ""} under it. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFund} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
