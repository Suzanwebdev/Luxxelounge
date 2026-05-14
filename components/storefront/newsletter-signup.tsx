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
      className="w-full min-w-0 space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4 md:mt-0"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your contact</p>
      <div className="space-y-1.5">
        <label htmlFor="private-edit-name" className="text-sm font-medium text-foreground">
          Name <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="private-edit-name"
          type="text"
          name="fullName"
          autoComplete="name"
          placeholder="Full name"
          className="h-11 w-full min-w-0"
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
      <div className="space-y-1.5">
        <label htmlFor="private-edit-phone" className="text-sm font-medium text-foreground">
          Phone or WhatsApp <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="private-edit-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+233 …"
          className="h-11 w-full min-w-0"
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
      <div className="space-y-1.5">
        <label htmlFor="private-edit-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id="private-edit-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="h-11 min-h-[2.75rem] w-full min-w-0 flex-1 sm:min-w-[12rem]"
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
            className="h-11 w-full shrink-0 px-4 sm:w-auto sm:min-w-[8.5rem]"
            disabled={status === "loading"}
          >
            {status === "loading" ? "…" : "Subscribe"}
            {status !== "loading" ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
          </Button>
        </div>
      </div>
      {message ? (
        <p
          id="newsletter-signup-status"
          role="status"
          className={
            status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
