"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Investment } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdingId: number;
  unitLabel: string;
  existing?: Investment | null;
  onSaved: () => void;
};

export function InvestmentFormDialog({
  open,
  onOpenChange,
  holdingId,
  unitLabel,
  existing,
  onSaved,
}: Props) {
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [units, setUnits] = useState(existing ? String(existing.units) : "");
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(existing?.date ?? new Date().toISOString().slice(0, 10));
    setUnits(existing ? String(existing.units) : "");
    setPrice(existing ? String(existing.price) : "");
    setError(null);
  }, [open, existing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const unitsNum = parseFloat(units);
    const priceNum = parseFloat(price);
    if (!date || isNaN(unitsNum) || unitsNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid date, units, and price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = existing ? `/api/investments/${existing.id}` : `/api/holdings/${holdingId}/investments`;
      const method = existing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, units: unitsNum, price: priceNum }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save");
        return;
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Investment" : "Add Investment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="units">{unitLabel}</Label>
            <Input
              id="units"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 12.5"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Price per unit at purchase (₹)</Label>
            <Input
              id="price"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 87.42"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          {units && price && !isNaN(parseFloat(units)) && !isNaN(parseFloat(price)) && (
            <p className="text-sm text-muted-foreground">
              Amount invested: ₹{(parseFloat(units) * parseFloat(price)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving…" : existing ? "Save Changes" : "Add Investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
