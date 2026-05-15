import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Financial Specialist — Custom Calculator Builder",
  description:
    "Describe your financial scenario in plain language and our AI builds a custom calculator with interactive charts, personalized analysis, and actionable plans — instantly and free.",
  openGraph: {
    title: "AI Financial Specialist | QFINHUB",
    description:
      "Create custom financial calculators with AI. Describe your scenario and get an interactive calculator with charts and a personalized plan in seconds.",
    images: ["/og-image.png"],
    url: "https://www.qfinhub.com/ai-specialist",
  },
  alternates: {
    canonical: "https://www.qfinhub.com/ai-specialist",
  },
};

export default function AISpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
