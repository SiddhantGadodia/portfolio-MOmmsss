"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import type { HoldingType } from "@/lib/types";

type SearchResult = { code: string; name: string; exchange?: string };

export function AddHoldingDialog({
  type,
  onAdded,
}: {
  type: HoldingType;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const searchEndpoint = type === "MF" ? "/api/search/mf" : "/api/search/stock";

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    fetch(`${searchEndpoint}?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchEndpoint]);

  async function handleSelect(item: SearchResult) {
    setAdding(true);
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: item.name, code: item.code }),
      });
      if (res.ok) {
        setOpen(false);
        setQuery("");
        setResults([]);
        onAdded();
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to add");
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setQuery("");
          setResults([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add {type === "MF" ? "Mutual Fund" : "Stock"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Add {type === "MF" ? "Mutual Fund" : "Equity Share"}</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false} className="rounded-lg">
          <CommandInput
            placeholder={type === "MF" ? "Search scheme name or code…" : "Search company name or symbol…"}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {searching && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>No matches found.</CommandEmpty>
            )}
            {!searching && query.trim().length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            )}
            {!searching && results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((item) => (
                  <CommandItem
                    key={item.code}
                    value={item.code}
                    disabled={adding}
                    onSelect={() => handleSelect(item)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm font-medium leading-tight">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.exchange ? `${item.exchange} · ${item.code}` : `Scheme code ${item.code}`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
