#!/usr/bin/env node
/**
 * Quick inbox diagnostic — what are the unread emails?
 */
const { readFileSync } = require("fs");
const { resolve } = require("path");
const { simpleParser } = require("mailparser");
const Imap = require("imap");

const ROOT = resolve(__dirname, "..");
const env = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
const envMap = {};
env.split("\n").forEach((line) => {
  const m = line.match(/^([^#=]+)=(.+)$/);
  if (m) envMap[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
});

const imap = new Imap({
  user: envMap.GMAIL_ADDRESS,
  password: envMap.GMAIL_APP_PASSWORD,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

imap.once("ready", () => {
  imap.openBox("INBOX", true, (err, box) => {
    if (err) { console.error("openBox error:", err.message); imap.end(); return; }

    console.log(`📬 Inbox: ${box.messages.total} total, ${box.messages.new} unseen`);

    // Unseen
    imap.search(["UNSEEN"], (err2, uids) => {
      if (err2) { console.error("search error:", err2.message); imap.end(); return; }

      console.log(`   Unseen UIDs: [${uids.slice(0, 10).join(", ")}${uids.length > 10 ? "..." : ""}]`);

      if (uids.length === 0) {
        console.log("   ✅ No unread emails.");
        imap.end();
        return;
      }

      const f = imap.fetch(uids, { bodies: "" });
      let count = 0;
      const total = uids.length;

      f.on("message", (msg) => {
        let buffer = "";
        let emailUid = null;
        msg.on("attributes", (attrs) => { emailUid = attrs.uid; });
        msg.on("body", (stream) => {
          stream.on("data", (chunk) => { buffer += chunk.toString(); });
        });
        msg.on("end", async () => {
          count++;
          try {
            const parsed = await simpleParser(buffer);
            const subj = parsed.subject || "(no subject)";
            const from = (parsed.from?.text || "unknown").substring(0, 60);
            const date = parsed.date ? parsed.date.toISOString().slice(0, 16) : "?";
            const isHARO = subj.toLowerCase().includes("haro") || from.includes("helpareporter");
            const text = (parsed.text || "").substring(0, 80).replace(/\n/g, " ");
            console.log(`\n  [UID ${emailUid}] ${isHARO ? "🔴 HARO" : "  OTHER"}`);
            console.log(`     From: ${from}`);
            console.log(`     Subj: ${subj.substring(0, 70)}`);
            console.log(`     Date: ${date}`);
            console.log(`     Text: ${text}`);
          } catch (e) {
            console.log(`\n  [UID ${emailUid}] ❌ Parse error: ${e.message}`);
          }

          if (count >= total) {
            imap.end();
          }
        });
      });

      f.on("error", (e) => {
        console.error("Fetch error:", e.message);
        imap.end();
      });
    });
  });
});

imap.once("error", (err) => {
  console.error("IMAP error:", err.message);
});

imap.connect();
