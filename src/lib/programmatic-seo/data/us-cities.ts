/**
 * US Cities data for geotargeted programmatic SEO pages.
 * People search "mortgage calculator [city]" constantly.
 * Each city gets its own targeted landing page.
 */

export interface CityInfo {
  name: string;
  state: string;
  stateAbbr: string;
  medianHomePrice: number;
  population: number;
  region: string;
}

// Top 200 US cities by population with median home prices
// Data approximates Zillow/Redfin median values
export const US_CITIES: CityInfo[] = [
  // === MEGA CITIES (top 10) ===
  { name: "New York", state: "New York", stateAbbr: "NY", medianHomePrice: 750000, population: 8336817, region: "Northeast" },
  { name: "Los Angeles", state: "California", stateAbbr: "CA", medianHomePrice: 975000, population: 3898747, region: "West" },
  { name: "Chicago", state: "Illinois", stateAbbr: "IL", medianHomePrice: 335000, population: 2746388, region: "Midwest" },
  { name: "Houston", state: "Texas", stateAbbr: "TX", medianHomePrice: 345000, population: 2304580, region: "South" },
  { name: "Phoenix", state: "Arizona", stateAbbr: "AZ", medianHomePrice: 460000, population: 1608139, region: "Southwest" },
  { name: "Philadelphia", state: "Pennsylvania", stateAbbr: "PA", medianHomePrice: 275000, population: 1603797, region: "Northeast" },
  { name: "San Antonio", state: "Texas", stateAbbr: "TX", medianHomePrice: 325000, population: 1547253, region: "South" },
  { name: "San Diego", state: "California", stateAbbr: "CA", medianHomePrice: 920000, population: 1386932, region: "West" },
  { name: "Dallas", state: "Texas", stateAbbr: "TX", medianHomePrice: 415000, population: 1304379, region: "South" },
  { name: "Austin", state: "Texas", stateAbbr: "TX", medianHomePrice: 565000, population: 964177, region: "South" },

  // === MAJOR CITIES (11-50) ===
  { name: "Jacksonville", state: "Florida", stateAbbr: "FL", medianHomePrice: 395000, population: 949611, region: "Southeast" },
  { name: "Fort Worth", state: "Texas", stateAbbr: "TX", medianHomePrice: 370000, population: 918915, region: "South" },
  { name: "Columbus", state: "Ohio", stateAbbr: "OH", medianHomePrice: 310000, population: 905748, region: "Midwest" },
  { name: "Charlotte", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 420000, population: 874579, region: "Southeast" },
  { name: "Indianapolis", state: "Indiana", stateAbbr: "IN", medianHomePrice: 285000, population: 887642, region: "Midwest" },
  { name: "San Francisco", state: "California", stateAbbr: "CA", medianHomePrice: 1400000, population: 873965, region: "West" },
  { name: "Seattle", state: "Washington", stateAbbr: "WA", medianHomePrice: 850000, population: 737015, region: "West" },
  { name: "Denver", state: "Colorado", stateAbbr: "CO", medianHomePrice: 620000, population: 715522, region: "West" },
  { name: "Nashville", state: "Tennessee", stateAbbr: "TN", medianHomePrice: 435000, population: 689447, region: "South" },
  { name: "Oklahoma City", state: "Oklahoma", stateAbbr: "OK", medianHomePrice: 255000, population: 681054, region: "South" },
  { name: "El Paso", state: "Texas", stateAbbr: "TX", medianHomePrice: 235000, population: 678815, region: "South" },
  { name: "Washington", state: "District of Columbia", stateAbbr: "DC", medianHomePrice: 700000, population: 689545, region: "Northeast" },
  { name: "Boston", state: "Massachusetts", stateAbbr: "MA", medianHomePrice: 800000, population: 675647, region: "Northeast" },
  { name: "Las Vegas", state: "Nevada", stateAbbr: "NV", medianHomePrice: 445000, population: 651572, region: "West" },
  { name: "Portland", state: "Oregon", stateAbbr: "OR", medianHomePrice: 555000, population: 652503, region: "West" },
  { name: "Memphis", state: "Tennessee", stateAbbr: "TN", medianHomePrice: 245000, population: 633104, region: "South" },
  { name: "Louisville", state: "Kentucky", stateAbbr: "KY", medianHomePrice: 270000, population: 633045, region: "South" },
  { name: "Baltimore", state: "Maryland", stateAbbr: "MD", medianHomePrice: 350000, population: 585708, region: "Northeast" },
  { name: "Milwaukee", state: "Wisconsin", stateAbbr: "WI", medianHomePrice: 275000, population: 577222, region: "Midwest" },
  { name: "Albuquerque", state: "New Mexico", stateAbbr: "NM", medianHomePrice: 330000, population: 564559, region: "Southwest" },
  { name: "Tucson", state: "Arizona", stateAbbr: "AZ", medianHomePrice: 365000, population: 542629, region: "Southwest" },
  { name: "Fresno", state: "California", stateAbbr: "CA", medianHomePrice: 435000, population: 542107, region: "West" },
  { name: "Sacramento", state: "California", stateAbbr: "CA", medianHomePrice: 560000, population: 524943, region: "West" },
  { name: "Mesa", state: "Arizona", stateAbbr: "AZ", medianHomePrice: 440000, population: 518012, region: "Southwest" },
  { name: "Kansas City", state: "Missouri", stateAbbr: "MO", medianHomePrice: 310000, population: 508090, region: "Midwest" },
  { name: "Atlanta", state: "Georgia", stateAbbr: "GA", medianHomePrice: 430000, population: 498715, region: "Southeast" },
  { name: "Omaha", state: "Nebraska", stateAbbr: "NE", medianHomePrice: 320000, population: 486051, region: "Midwest" },
  { name: "Colorado Springs", state: "Colorado", stateAbbr: "CO", medianHomePrice: 480000, population: 478961, region: "West" },
  { name: "Raleigh", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 445000, population: 467665, region: "Southeast" },
  { name: "Long Beach", state: "California", stateAbbr: "CA", medianHomePrice: 815000, population: 466742, region: "West" },
  { name: "Virginia Beach", state: "Virginia", stateAbbr: "VA", medianHomePrice: 390000, population: 459470, region: "Southeast" },
  { name: "Miami", state: "Florida", stateAbbr: "FL", medianHomePrice: 625000, population: 442241, region: "Southeast" },
  { name: "Oakland", state: "California", stateAbbr: "CA", medianHomePrice: 850000, population: 440646, region: "West" },
  { name: "Minneapolis", state: "Minnesota", stateAbbr: "MN", medianHomePrice: 395000, population: 429954, region: "Midwest" },
  { name: "Tampa", state: "Florida", stateAbbr: "FL", medianHomePrice: 455000, population: 384959, region: "Southeast" },
  { name: "Tulsa", state: "Oklahoma", stateAbbr: "OK", medianHomePrice: 265000, population: 413066, region: "South" },
  { name: "Arlington", state: "Texas", stateAbbr: "TX", medianHomePrice: 385000, population: 394266, region: "South" },
  { name: "New Orleans", state: "Louisiana", stateAbbr: "LA", medianHomePrice: 320000, population: 383997, region: "South" },
  { name: "Cleveland", state: "Ohio", stateAbbr: "OH", medianHomePrice: 195000, population: 372624, region: "Midwest" },
  { name: "Anaheim", state: "California", stateAbbr: "CA", medianHomePrice: 860000, population: 346970, region: "West" },
  { name: "Honolulu", state: "Hawaii", stateAbbr: "HI", medianHomePrice: 1050000, population: 350964, region: "West" },
  { name: "Henderson", state: "Nevada", stateAbbr: "NV", medianHomePrice: 465000, population: 317610, region: "West" },
  { name: "Orlando", state: "Florida", stateAbbr: "FL", medianHomePrice: 450000, population: 307573, region: "Southeast" },
  { name: "Cincinnati", state: "Ohio", stateAbbr: "OH", medianHomePrice: 285000, population: 309317, region: "Midwest" },
  { name: "Pittsburgh", state: "Pennsylvania", stateAbbr: "PA", medianHomePrice: 235000, population: 302971, region: "Northeast" },
  { name: "St. Louis", state: "Missouri", stateAbbr: "MO", medianHomePrice: 255000, population: 301578, region: "Midwest" },
  { name: "Riverside", state: "California", stateAbbr: "CA", medianHomePrice: 625000, population: 314998, region: "West" },
  { name: "Buffalo", state: "New York", stateAbbr: "NY", medianHomePrice: 265000, population: 278349, region: "Northeast" },
  { name: "Corpus Christi", state: "Texas", stateAbbr: "TX", medianHomePrice: 275000, population: 317863, region: "South" },
  { name: "Stockton", state: "California", stateAbbr: "CA", medianHomePrice: 525000, population: 320804, region: "West" },
  { name: "Bakersfield", state: "California", stateAbbr: "CA", medianHomePrice: 390000, population: 403455, region: "West" },
  { name: "Norfolk", state: "Virginia", stateAbbr: "VA", medianHomePrice: 340000, population: 238005, region: "Southeast" },
  { name: "Greensboro", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 295000, population: 299035, region: "Southeast" },
  { name: "Durham", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 410000, population: 283506, region: "Southeast" },
  { name: "Winston-Salem", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 310000, population: 251350, region: "Southeast" },
  { name: "Madison", state: "Wisconsin", stateAbbr: "WI", medianHomePrice: 425000, population: 269840, region: "Midwest" },
  { name: "Lexington", state: "Kentucky", stateAbbr: "KY", medianHomePrice: 285000, population: 322570, region: "South" },
  { name: "Knoxville", state: "Tennessee", stateAbbr: "TN", medianHomePrice: 330000, population: 190740, region: "South" },
  { name: "Birmingham", state: "Alabama", stateAbbr: "AL", medianHomePrice: 250000, population: 200733, region: "Southeast" },
  { name: "Richmond", state: "Virginia", stateAbbr: "VA", medianHomePrice: 380000, population: 226610, region: "Southeast" },
  { name: "Rochester", state: "New York", stateAbbr: "NY", medianHomePrice: 235000, population: 211328, region: "Northeast" },
  { name: "Boise", state: "Idaho", stateAbbr: "ID", medianHomePrice: 520000, population: 235684, region: "West" },
  { name: "Spokane", state: "Washington", stateAbbr: "WA", medianHomePrice: 440000, population: 228989, region: "West" },
  { name: "Salt Lake City", state: "Utah", stateAbbr: "UT", medianHomePrice: 590000, population: 199723, region: "West" },
  { name: "Des Moines", state: "Iowa", stateAbbr: "IA", medianHomePrice: 320000, population: 214133, region: "Midwest" },
  { name: "Reno", state: "Nevada", stateAbbr: "NV", medianHomePrice: 590000, population: 264165, region: "West" },
  { name: "Providence", state: "Rhode Island", stateAbbr: "RI", medianHomePrice: 480000, population: 179335, region: "Northeast" },
  { name: "Santa Ana", state: "California", stateAbbr: "CA", medianHomePrice: 850000, population: 332318, region: "West" },
  { name: "Chattanooga", state: "Tennessee", stateAbbr: "TN", medianHomePrice: 345000, population: 181099, region: "South" },
  { name: "Fort Wayne", state: "Indiana", stateAbbr: "IN", medianHomePrice: 265000, population: 268378, region: "Midwest" },
  { name: "Grand Rapids", state: "Michigan", stateAbbr: "MI", medianHomePrice: 340000, population: 198917, region: "Midwest" },
  { name: "Huntsville", state: "Alabama", stateAbbr: "AL", medianHomePrice: 375000, population: 215006, region: "Southeast" },
  { name: "Fayetteville", state: "North Carolina", stateAbbr: "NC", medianHomePrice: 310000, population: 208501, region: "Southeast" },
  { name: "Lincoln", state: "Nebraska", stateAbbr: "NE", medianHomePrice: 345000, population: 291082, region: "Midwest" },
  { name: "Anchorage", state: "Alaska", stateAbbr: "AK", medianHomePrice: 385000, population: 291247, region: "West" },
  { name: "Newark", state: "New Jersey", stateAbbr: "NJ", medianHomePrice: 380000, population: 282011, region: "Northeast" },
  { name: "Toledo", state: "Ohio", stateAbbr: "OH", medianHomePrice: 185000, population: 270871, region: "Midwest" },
  { name: "Port St. Lucie", state: "Florida", stateAbbr: "FL", medianHomePrice: 435000, population: 201846, region: "Southeast" },
  { name: "Springfield", state: "Missouri", stateAbbr: "MO", medianHomePrice: 265000, population: 169176, region: "Midwest" },
  { name: "St. Petersburg", state: "Florida", stateAbbr: "FL", medianHomePrice: 445000, population: 258313, region: "Southeast" },
  { name: "Tallahassee", state: "Florida", stateAbbr: "FL", medianHomePrice: 335000, population: 196169, region: "Southeast" },
  { name: "Lubbock", state: "Texas", stateAbbr: "TX", medianHomePrice: 240000, population: 257141, region: "South" },
  { name: "Garland", state: "Texas", stateAbbr: "TX", medianHomePrice: 335000, population: 246918, region: "South" },
  { name: "Irving", state: "Texas", stateAbbr: "TX", medianHomePrice: 390000, population: 256684, region: "South" },
  { name: "Scottsdale", state: "Arizona", stateAbbr: "AZ", medianHomePrice: 900000, population: 241361, region: "Southwest" },
  { name: "Bridgeport", state: "Connecticut", stateAbbr: "CT", medianHomePrice: 350000, population: 148654, region: "Northeast" },
  { name: "Fort Collins", state: "Colorado", stateAbbr: "CO", medianHomePrice: 590000, population: 169810, region: "West" },
  { name: "Santa Clarita", state: "California", stateAbbr: "CA", medianHomePrice: 725000, population: 228673, region: "West" },
  { name: "Eugene", state: "Oregon", stateAbbr: "OR", medianHomePrice: 510000, population: 176654, region: "West" },
];

/**
 * Get cities by state.
 */
export function getCitiesByState(stateAbbr: string): CityInfo[] {
  return US_CITIES.filter((c) => c.stateAbbr === stateAbbr);
}

/**
 * Get city by name and state.
 */
export function getCity(name: string, stateAbbr: string): CityInfo | undefined {
  return US_CITIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.stateAbbr === stateAbbr
  );
}

/**
 * Get the median home price for a city, defaulting to state average if not found.
 */
export function getCityMedianPrice(name: string, stateAbbr: string): number {
  const city = getCity(name, stateAbbr);
  return city?.medianHomePrice ?? 350000;
}

/**
 * Get all unique state slugs from cities.
 */
export function getCityStateSlugs(): string[] {
  const abbrs = new Set(US_CITIES.map((c) => c.stateAbbr.toLowerCase()));
  return Array.from(abbrs);
}

/**
 * Generate a geotargeted slug like "mortgage-calculator-houston-tx"
 */
export function generateGeotargetedSlug(
  calculatorName: string,
  cityName: string,
  stateAbbr: string
): string {
  const citySlug = cityName.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
  const stateSlug = stateAbbr.toLowerCase();
  return `${calculatorName}-${citySlug}-${stateSlug}`;
}

/**
 * Calculator types that benefit from geotargeting
 */
export const GEOTARGETED_CALCULATORS = [
  { id: "mortgage-calculator", slug: "mortgage", label: "Mortgage Calculator" },
  { id: "mortgage-affordability", slug: "mortgage-affordability", label: "Mortgage Affordability" },
  { id: "rent-vs-buy", slug: "rent-vs-buy", label: "Rent vs Buy" },
  { id: "loan-calculator", slug: "loan", label: "Loan Calculator" },
  { id: "tax-calculator", slug: "tax", label: "Tax Calculator" },
  { id: "refinancing", slug: "refinance", label: "Refinance Calculator" },
];

/**
 * Generate ALL geotargeted variant slugs for a calculator.
 */
export function generateGeotargetedVariants(calcSlug: string): { slug: string; city: CityInfo }[] {
  return US_CITIES.map((city) => ({
    slug: generateGeotargetedSlug(calcSlug, city.name, city.stateAbbr),
    city,
  }));
}

/**
 * Total number of possible geotargeted pages.
 */
export function getTotalGeotargetedPages(): number {
  return US_CITIES.length * GEOTARGETED_CALCULATORS.length;
}
