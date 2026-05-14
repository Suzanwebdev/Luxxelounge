"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
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
        body: JSON.stringify({ email })
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
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 md:mt-0">
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          className="h-11 md:w-72"
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
        <Button type="submit" size="sm" className="h-11 shrink-0 px-4" disabled={status === "loading"}>
          {status === "loading" ? "…" : "Subscribe"}
          {status !== "loading" ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
        </Button>
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
