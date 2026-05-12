"use client";

import * as React from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type FormStatus = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email address";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    else if (message.trim().length < 10)
      newErrors.message = "Message must be at least 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("sending");

    // Build mailto link as submission method
    const mailtoLink = `mailto:q.finhub@gmail.com?subject=${encodeURIComponent(
      `[QFINHUB Contact] ${subject}`
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n---\n\n${message}`
    )}`;

    // Try to open mailto
    try {
      window.location.href = mailtoLink;
      // Show sent state
      setStatus("sent");
      // Reset after a delay
      setTimeout(() => {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setStatus("idle");
      }, 5000);
    } catch {
      setStatus("error");
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-surface-dark dark:text-gray-100 dark:placeholder-gray-500 ${
      errors[field]
        ? "border-red-400 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Name & Email Row */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={inputClass("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Your Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            className={inputClass("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="contact-subject"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          placeholder="How can we help you?"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject)
              setErrors((prev) => ({ ...prev, subject: "" }));
          }}
          className={inputClass("subject")}
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Tell us more about your question or feedback..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message)
              setErrors((prev) => ({ ...prev, message: "" }));
          }}
          className={`${inputClass("message")} resize-y min-h-[120px]`}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {message.length} / minimum 10 characters
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : status === "sent" ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Message Ready — Check Your Email Client
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>

      {/* Status Messages */}
      {status === "sent" && (
        <div className="flex items-start gap-3 rounded-lg bg-accent-50 p-4 dark:bg-accent-900/20">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-400" />
          <div>
            <p className="text-sm font-medium text-accent-800 dark:text-accent-200">
              Message Ready to Send
            </p>
            <p className="mt-1 text-xs text-accent-600 dark:text-accent-400">
              Your email client has been opened with the message pre-filled.
              Just click send to deliver it to{" "}
              <strong>q.finhub@gmail.com</strong>.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Something went wrong
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Please email us directly at{" "}
              <a
                href="mailto:q.finhub@gmail.com"
                className="font-medium underline underline-offset-2"
              >
                q.finhub@gmail.com
              </a>
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        By submitting this form, you agree to our{" "}
        <a
          href="/privacy"
          className="text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400"
        >
          Privacy Policy
        </a>
        . Your information will only be used to respond to your inquiry.
      </p>
    </form>
  );
}
