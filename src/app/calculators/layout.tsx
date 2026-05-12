import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculators",
  description:
    "Browse professional financial calculators across multiple categories. Calculate, compare, and export your financial results.",
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
