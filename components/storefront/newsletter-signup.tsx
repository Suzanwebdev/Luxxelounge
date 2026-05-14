"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/storefront/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined
        })
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        alreadySubscribed?: boolean;
        emailSent?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setEmail("");
      setFullName("");
      setPhone("");
      if (data.alreadySubscribed) {
        setMessage("You are already on the list. Thank you.");
      } else if (data.emailSent) {
        setMessage("You are in. Check your inbox (and spam) for a short confirmation from Luxxelounge.");
      } else {
        setMessage(
          "You are on the list. We could not send a confirmation email from the server (set RESEND_API_KEY on Vercel and verify your sending domain in Resend). Your signup is still saved."
        );
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full min-w-0 space-y-2 rounded-xl border border-border/80 bg-muted/15 p-3 md:mt-0"
    >
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
      <div className="space-y-1">
        <label htmlFor="private-edit-name" className="text-xs font-medium text-foreground">
          Name <span className="font-normal text-muted-foreground">(opt.)</span>
        </label>
        <Input
          id="private-edit-name"
          type="text"
          name="fullName"
          autoComplete="name"
          placeholder="Full name"
          className="h-9 w-full min-w-0 text-sm"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (status === "success" || status === "error") {
              setStatus("idle");
              setMessage(null);
            }
          }}
          disabled={status === "loading"}
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="private-edit-phone" className="text-xs font-medium text-foreground">
          Phone / WhatsApp <span className="font-normal text-muted-foreground">(opt.)</span>
        </label>
        <Input
          id="private-edit-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+233 …"
          className="h-9 w-full min-w-0 text-sm"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (status === "success" || status === "error") {
              setStatus("idle");
              setMessage(null);
            }
          }}
          disabled={status === "loading"}
          maxLength={40}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="private-edit-email" className="text-xs font-medium text-foreground">
          Email
        </label>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <Input
            id="private-edit-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            className="h-9 w-full min-w-0 flex-1 text-sm sm:min-w-0"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "success" || status === "error") {
                setStatus("idle");
                setMessage(null);
              }
            }}
            disabled={status === "loading"}
            required
            aria-invalid={status === "error"}
            aria-describedby={message ? "newsletter-signup-status" : undefined}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 w-full shrink-0 px-3 text-sm sm:w-auto sm:min-w-[7.5rem]"
            disabled={status === "loading"}
          >
            {status === "loading" ? "…" : "Subscribe"}
            {status !== "loading" ? <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden /> : null}
          </Button>
        </div>
      </div>
      {message ? (
        <p
          id="newsletter-signup-status"
          role="status"
          className={
            status === "error"
              ? "text-xs text-destructive"
              : "text-xs leading-snug text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
