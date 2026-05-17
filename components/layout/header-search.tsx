"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-xl border border-border p-0 md:h-11 md:w-11 md:rounded-2xl"
          aria-label="Search products"
        >
          <Search className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-3xl border border-border bg-background p-5 shadow-lg outline-none">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="font-heading text-lg">Search products</Dialog.Title>
            <Dialog.Close
              type="button"
              className="rounded-xl p-2 hover:bg-accent"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Search the catalog by name, category, or tags. Results open on the shop page.
          </Dialog.Description>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              ref={inputRef}
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              autoComplete="off"
              aria-label="Search query"
            />
            <Button type="submit" className="w-full">
              Search
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
