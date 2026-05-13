/**
 * QFINHUB Infographic Generator
 * 
 * Generates beautiful finance infographics as SVG — completely FREE.
 * No API calls needed. Each infographic is ~2KB SVG.
 * 
 * These can be uploaded to X as tweet media.
 */

const BRAND_COLORS = {
  primary: "#1e40af",    // blue-800
  accent: "#dc2626",     // red-600
  gradient1: "#1e40af",
  gradient2: "#6366f1",  // indigo-500
  bg: "#ffffff",
  text: "#1f2937",       // gray-800
  muted: "#6b7280",      // gray-500
  lightBg: "#f3f4f6",    // gray-100
  green: "#059669",      // emerald-600
  gold: "#d97706",       // amber-600
};

interface InfographicData {
  title: string;
  subtitle?: string;
  value: string;
  valueLabel: string;
  comparisonValue?: string;
  comparisonLabel?: string;
  footnote?: string;
  // Bar chart data
  bars?: { label: string; value: number; color?: string }[];
  // Key stat boxes
  stats?: { label: string; value: string; icon?: string }[];
}

/**
 * Generate a comparison infographic (e.g., "30yr vs 15yr Mortgage")
 */
export function generateComparisonSVG(data: InfographicData): string {
  const w = 800;
  const h = 418;
  const maxBar = data.bars ? Math.max(...data.bars.map((b) => b.value)) : 100;

  let barsHTML = "";
  if (data.bars) {
    const barW = Math.floor((w - 120) / data.bars.length) - 16;
    data.bars.forEach((bar, i) => {
      const barH = Math.max((bar.value / maxBar) * 180, 20);
      const x = 60 + i * (barW + 16);
      const y = 190 - barH;
      const color = bar.color || (i % 2 === 0 ? BRAND_COLORS.primary : BRAND_COLORS.accent);
      barsHTML += `
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.9"/>
        <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="600" fill="${BRAND_COLORS.text}">${bar.value.toLocaleString()}</text>
        <text x="${x + barW / 2}" y="206" text-anchor="middle" font-size="11" fill="${BRAND_COLORS.muted}">${bar.label}</text>
      `;
    });
  }

  let statsHTML = "";
  if (data.stats) {
    const boxW = Math.floor(w / data.stats.length) - 16;
    data.stats.forEach((stat, i) => {
      const x = 8 + i * (boxW + 8);
      statsHTML += `
        <rect x="${x}" y="270" width="${boxW}" height="80" rx="8" fill="${BRAND_COLORS.lightBg}"/>
        <text x="${x + boxW / 2}" y="300" text-anchor="middle" font-size="22" font-weight="700" fill="${BRAND_COLORS.primary}">${stat.value}</text>
        <text x="${x + boxW / 2}" y="324" text-anchor="middle" font-size="10" fill="${BRAND_COLORS.muted}">${stat.label}</text>
      `;
    });
  }

  const comparisonHTML = data.comparisonValue ? `
    <text x="400" y="110" text-anchor="middle" font-size="36" font-weight="700" fill="${BRAND_COLORS.primary}">${data.value}</text>
    <text x="400" y="130" text-anchor="middle" font-size="12" fill="${BRAND_COLORS.muted}">${data.valueLabel}</text>
    <text x="400" y="160" text-anchor="middle" font-size="14" fill="${BRAND_COLORS.green}">vs ${data.comparisonValue} ${data.comparisonLabel}</text>
  ` : data.bars ? "" : `
    <text x="400" y="110" text-anchor="middle" font-size="48" font-weight="700" fill="${BRAND_COLORS.primary}">${data.value}</text>
    <text x="400" y="132" text-anchor="middle" font-size="13" fill="${BRAND_COLORS.muted}">${data.valueLabel}</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${BRAND_COLORS.gradient1}"/>
      <stop offset="100%" stop-color="${BRAND_COLORS.gradient2}"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${w}" height="${h}" rx="16" fill="${BRAND_COLORS.bg}"/>
  
  <!-- Header bar -->
  <rect x="0" y="0" width="${w}" height="48" rx="16" fill="url(#headerGrad)"/>
  <rect x="0" y="16" width="${w}" height="32" fill="url(#headerGrad)"/>
  
  <!-- QFINHUB branding -->
  <text x="20" y="32" font-size="13" font-weight="700" fill="white">QFINHUB</text>
  
  <!-- Title -->
  <text x="400" y="72" text-anchor="middle" font-size="18" font-weight="700" fill="${BRAND_COLORS.text}">${data.title}</text>
  ${data.subtitle ? `<text x="400" y="92" text-anchor="middle" font-size="12" fill="${BRAND_COLORS.muted}">${data.subtitle}</text>` : ""}
  
  ${comparisonHTML}
  ${barsHTML}
  ${statsHTML}
  
  <!-- Footnote -->
  ${data.footnote ? `<text x="400" y="${h - 12}" text-anchor="middle" font-size="9" fill="#9ca3af">${data.footnote}</text>` : ""}
</svg>`;
}

/**
 * Generate a "Did You Know?" stat card infographic
 */
export function generateStatCardSVG(
  title: string,
  stat: string,
  description: string,
  link: string
): string {
  const w = 800;
  const h = 418;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_COLORS.gradient1}"/>
      <stop offset="100%" stop-color="${BRAND_COLORS.gradient2}"/>
    </linearGradient>
  </defs>
  
  <rect width="${w}" height="${h}" rx="16" fill="url(#bgGrad)"/>
  
  <!-- QFINHUB -->
  <text x="30" y="50" font-size="13" font-weight="700" fill="rgba(255,255,255,0.7)">QFINHUB</text>
  
  <!-- Title -->
  <text x="400" y="120" text-anchor="middle" font-size="22" font-weight="700" fill="white">${title}</text>
  
  <!-- Big Stat -->
  <text x="400" y="230" text-anchor="middle" font-size="64" font-weight="800" fill="white">${stat}</text>
  
  <!-- Description -->
  <text x="400" y="270" text-anchor="middle" font-size="15" fill="rgba(255,255,255,0.85)">${description}</text>
  
  <!-- CTA -->
  <text x="400" y="360" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.6)">Try it free at qfinhub.com</text>
</svg>`;
}

/**
 * Generate an investment growth curve SVG
 */
export function generateGrowthChartSVG(
  initialInvestment: number,
  monthlyContribution: number,
  rate: number,
  years: number
): string {
  const w = 800;
  const h = 418;
  
  // Calculate growth curve points
  const monthly = 12;
  const periods = years * monthly;
  const monthlyRate = rate / 100 / monthly;
  const points: { x: number; y: number; value: number }[] = [];
  
  for (let i = 0; i <= periods; i += Math.max(1, Math.floor(periods / 20))) {
    let balance = initialInvestment;
    for (let j = 0; j < i; j++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    const px = 60 + (i / periods) * (w - 120);
    const py = 300 - (balance / 1500000) * 220;
    points.push({ x: px, y: Math.max(50, py), value: Math.round(balance) });
  }
  
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = pathD + ` L${points[points.length - 1]?.x ?? 0},300 L${points[0]?.x ?? 0},300 Z`;
  
  const finalValue = points[points.length - 1]?.value || 0;
  const totalContributions = initialInvestment + monthlyContribution * years * 12;
  const earnings = finalValue - totalContributions;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_COLORS.primary}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${BRAND_COLORS.primary}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  
  <rect width="${w}" height="${h}" rx="16" fill="${BRAND_COLORS.bg}"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="${w}" height="48" rx="16" fill="${BRAND_COLORS.primary}"/>
  <rect x="0" y="16" width="${w}" height="32" fill="${BRAND_COLORS.primary}"/>
  <text x="20" y="32" font-size="13" font-weight="700" fill="white">QFINHUB — Investment Growth Calculator</text>
  
  <!-- Values -->
  <text x="60" y="80" font-size="12" fill="${BRAND_COLORS.muted}">Final Balance</text>
  <text x="60" y="110" font-size="28" font-weight="700" fill="${BRAND_COLORS.primary}">$${finalValue.toLocaleString()}</text>
  
  <text x="60" y="140" font-size="11" fill="${BRAND_COLORS.green}">+$${earnings.toLocaleString()} earnings</text>
  <text x="60" y="158" font-size="11" fill="${BRAND_COLORS.muted}">$${initialInvestment.toLocaleString()} initial + $${(monthlyContribution * years * 12).toLocaleString()} invested</text>
  
  <!-- Growth area -->
  <path d="${areaD}" fill="url(#areaGrad)"/>
  <path d="${pathD}" fill="none" stroke="${BRAND_COLORS.primary}" stroke-width="2.5"/>
  
  <!-- End dot -->
  <circle cx="${(points[points.length - 1]?.x ?? 0)}" cy="${(points[points.length - 1]?.y ?? 0)}" r="5" fill="${BRAND_COLORS.accent}"/>
  <text x="${(points[points.length - 1]?.x ?? 0) - 10}" y="${(points[points.length - 1]?.y ?? 0) - 12}" text-anchor="end" font-size="11" fill="${BRAND_COLORS.accent}" font-weight="600">$${finalValue.toLocaleString()}</text>
  
  <!-- X-axis labels -->
  <text x="60" y="320" font-size="10" fill="#9ca3af">Year 0</text>
  <text x="${w - 60}" y="320" text-anchor="end" font-size="10" fill="#9ca3af">Year ${years}</text>
  
  <!-- Footnote -->
  <text x="400" y="${h - 12}" text-anchor="middle" font-size="9" fill="#9ca3af">At ${rate}% annual return with $${monthlyContribution.toLocaleString()}/month contributions</text>
</svg>`;
}

/**
 * Generate a comparison table SVG (e.g., 30yr Fixed vs 15yr Fixed vs ARM)
 */
export function generateComparisonTableSVG(
  title: string,
  columns: string[],
  rows: { label: string; values: string[]; highlight?: boolean }[]
): string {
  const w = 800;
  const h = 418;
  const colW = Math.floor((w - 40) / columns.length);
  const rowH = 32;
  const headerH = 40;
  const startY = 90;

  let headersHTML = columns
    .map((col, i) => {
      const x = 20 + i * colW;
      return `<text x="${x + colW / 2}" y="${startY - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="${BRAND_COLORS.primary}">${col}</text>`;
    })
    .join("");

  let rowsHTML = rows
    .map((row, i) => {
      const y = startY + i * rowH;
      const bgColor = row.highlight ? BRAND_COLORS.lightBg : "transparent";
      // Skip alternating bg since highlight is handled
      const bg = (!row.highlight && i % 2 === 1) ? BRAND_COLORS.lightBg : bgColor;
      const cells = row.values
        .map((val, j) => {
          const x = 20 + j * colW;
          const color = j === 0 ? BRAND_COLORS.text : BRAND_COLORS.primary;
          const weight = j === 0 ? 500 : 700;
          return `<text x="${x + colW / 2}" y="${y + 20}" text-anchor="middle" font-size="13" font-weight="${weight}" fill="${color}">${val}</text>`;
        })
        .join("");
      return `<rect x="20" y="${y}" width="${w - 40}" height="${rowH}" rx="4" fill="${bg}"/>${cells}`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="16" fill="${BRAND_COLORS.bg}"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="${w}" height="48" rx="16" fill="${BRAND_COLORS.primary}"/>
  <rect x="0" y="16" width="${w}" height="32" fill="${BRAND_COLORS.primary}"/>
  <text x="20" y="32" font-size="13" font-weight="700" fill="white">QFINHUB</text>
  <text x="${w - 20}" y="32" text-anchor="end" font-size="12" fill="rgba(255,255,255,0.8)">Free Financial Calculators</text>
  
  <!-- Title -->
  <text x="400" y="72" text-anchor="middle" font-size="16" font-weight="700" fill="${BRAND_COLORS.text}">${title}</text>
  
  ${headersHTML}
  <line x1="20" y1="${startY}" x2="${w - 20}" y2="${startY}" stroke="#e5e7eb" stroke-width="1"/>
  
  ${rowsHTML}
</svg>`;
}

/**
 * Generate random infographic for tweet rotation
 */
export function getRandomInfographic(): string {
  const infographics = [
    // Mortgage comparison
    generateComparisonTableSVG(
      "30-Year Fixed vs 15-Year Fixed vs 5/1 ARM",
      ["Loan Type", "Rate", "Monthly", "Total Interest"],
      [
        { label: "30-Year Fixed", values: ["30-Year Fixed", "6.875%", "$1,969", "$308,800"] },
        { label: "15-Year Fixed", values: ["15-Year Fixed", "5.990%", "$2,531", "$155,700"], highlight: true },
        { label: "5/1 ARM", values: ["5/1 ARM", "6.375%", "$1,872", "$273,900"] },
      ]
    ),
    // Compound interest growth
    generateGrowthChartSVG(10000, 500, 7, 30),
    // Stat card
    generateStatCardSVG(
      "Did You Know?",
      "$308,800",
      "Average total interest paid on a 30-year mortgage at 6.875%",
      "https://www.qfinhub.com/calculators/mortgage"
    ),
    // Investment comparison
    generateComparisonSVG({
      title: "Investment Growth Comparison",
      subtitle: "$10,000 invested over 30 years",
      value: "$76,122",
      valueLabel: "At 7% return",
      comparisonValue: "$10,000",
      comparisonLabel: "At 0% (no growth)",
      footnote: "Source: QFINHUB compound interest calculator",
      stats: [
        { label: "Monthly Contribution", value: "$500" },
        { label: "Total Invested", value: "$190,000" },
        { label: "Total Return", value: "$492,840" },
      ],
    }),
    // Mortgage rate bars
    generateComparisonSVG({
      title: "Mortgage Rates This Week",
      bars: [
        { label: "30yr Fixed", value: 6.875, color: BRAND_COLORS.accent },
        { label: "15yr Fixed", value: 5.99, color: BRAND_COLORS.green },
        { label: "5/1 ARM", value: 6.375, color: BRAND_COLORS.primary },
        { label: "FHA", value: 6.5, color: BRAND_COLORS.gold },
      ],
      value: "",
      valueLabel: "",
      footnote: "Rates as of this week. Check qfinhub.com for latest.",
    }),
  ];

  return infographics[Math.floor(Math.random() * infographics.length)] ?? "";
}
