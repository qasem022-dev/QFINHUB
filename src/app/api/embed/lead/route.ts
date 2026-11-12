import { NextRequest, NextResponse } from "next/server";
import { findClient, leadCaptureAllowed } from "@/lib/embed/clients";

/**
 * Lead delivery for the white-label embed.
 *
 * Design notes:
 * - The destination webhook comes from SERVER config keyed by licence, never
 *   from the request body. Accepting a client-supplied URL would make this an
 *   open relay that anyone could point at any host.
 * - Leads are forwarded, not stored. There is no database on this project, and a
 *   lead belongs in the customer's CRM anyway.
 */

type Payload = {
  key?: string;
  calculator?: string;
  calculatorTitle?: string;
  name?: string;
  email?: string;
  phone?: string;
  consent?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const client = findClient(body.key);
  if (!client || !leadCaptureAllowed(client)) {
    return NextResponse.json({ error: "Not licensed" }, { status: 403 });
  }

  const name = str(body.name, 80);
  const email = str(body.email, 120);
  const phone = str(body.phone, 30);
  const calculator = str(body.calculator, 80);

  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Name and a valid email are required" },
      { status: 422 },
    );
  }

  if (body.consent !== true) {
    return NextResponse.json({ error: "Consent required" }, { status: 422 });
  }

  const lead = {
    receivedAt: new Date().toISOString(),
    client: client.name,
    plan: client.plan,
    calculator,
    calculatorTitle: str(body.calculatorTitle, 120),
    name,
    email,
    phone,
    // Provenance helps the customer see which page produced the lead.
    source: request.headers.get("referer") || null,
    userAgent: request.headers.get("user-agent") || null,
  };

  if (!client.webhook) {
    // Licensed for capture but no destination configured — that is our mistake,
    // not the visitor's, so log loudly rather than telling them it failed.
    console.error("[embed-lead] no webhook configured for client", client.name, lead);
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(client.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error("[embed-lead] webhook rejected", client.name, res.status);
      return NextResponse.json(
        { error: "Could not deliver your details. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[embed-lead] webhook failed", client.name, err);
    return NextResponse.json(
      { error: "Could not deliver your details. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, delivered: true });
}
