"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/storefront/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, message })
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        storeNotified?: boolean;
        visitorNotified?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setFullName("");
      setEmail("");
      setMessage("");

      if (data.visitorNotified) {
        let text =
          "Message sent. We emailed you a short confirmation—check spam if you do not see it. Our team will reply soon.";
        if (!data.storeNotified) {
          text +=
            " (Store notification email is not set yet; your message is still saved for the team in the admin dashboard.)";
        }
        setFeedback(text);
      } else {
        setFeedback(
          "Your message was saved. We could not send email from the server (configure RESEND_API_KEY and a verified domain in Resend, and set Store email in Admin → Settings or CONTACT_INBOX_EMAIL on Vercel). We will still see your message in the admin dashboard."
        );
      }
    } catch {
      setStatus("error");
      setFeedback("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-border bg-card p-5">
      <Input
        placeholder="Full name"
        name="fullName"
        autoComplete="name"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (status === "success" || status === "error") {
            setStatus("idle");
            setFeedback(null);
          }
        }}
        disabled={status === "loading"}
        required
        maxLength={120}
      />
      <Input
        type="email"
        placeholder="Email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "success" || status === "error") {
            setStatus("idle");
            setFeedback(null);
          }
        }}
        disabled={status === "loading"}
        required
      />
      <Textarea
        placeholder="Message"
        name="message"
        rows={5}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (status === "success" || status === "error") {
            setStatus("idle");
            setFeedback(null);
          }
        }}
        disabled={status === "loading"}
        required
        maxLength={5000}
        className="min-h-[120px] resize-y"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
      {feedback ? (
        <p
          role="status"
          className={
            status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {feedback}
        </p>
      ) : null}
    </form>
  );
}
