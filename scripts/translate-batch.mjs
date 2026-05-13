/**
 * Fast batch translation — translates one locale JSON section at a time
 * across ALL remaining languages simultaneously.
 * 
 * Much faster because it translates 20 languages per section in one API call.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../src/i18n/locales");

const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_PRO_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

const REMAINING_LANGUAGES = [
  { code: "no", name: "Norwegian" },
  { code: "tr", name: "Turkish" },
  { code: "el", name: "Greek" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "ro", name: "Romanian" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "ar", name: "Arabic" },
  { code: "he", name: "Hebrew" },
  { code: "ur", name: "Urdu" },
  { code: "zh", name: "Chinese Simplified" },
  { code: "zh-TW", name: "Chinese Traditional" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
];

// Skip languages that are already done
const EXISTING_CODES = ["en", "es", "hi", "de", "fr", "it", "pt", "nl", "pl", "sv", "no", "da", "fi"];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * First pass: process each top-level section key of en.json
 * translating to ALL remaining languages in one API call per section.
 * This is MUCH more efficient than one API call per language.
 */
async function translateSections() {
  const sourceObj = JSON.parse(readFileSync(resolve(LOCALES_DIR, "en.json"), "utf-8"));
  const sectionKeys = Object.keys(sourceObj);
  
  // Load existing partial translations for remaining languages
  const targetLangs = REMAINING_LANGUAGES.filter(l => !EXISTING_CODES.includes(l.code));
  const results = {};
  for (const lang of targetLangs) {
    const path = resolve(LOCALES_DIR, `${lang.code}.json`);
    if (existsSync(path)) {
      try { results[lang.code] = JSON.parse(readFileSync(path, "utf-8")); }
      catch { results[lang.code] = {}; }
    } else {
      results[lang.code] = {};
    }
  }

  console.log(`Target: ${targetLangs.length} languages, ${sectionKeys.length} sections`);

  for (const sectionKey of sectionKeys) {
    const section = sourceObj[sectionKey];
    
    // Check if all languages already have this section
    const allHaveSection = targetLangs.every(l => results[l.code][sectionKey] !== undefined);
    if (allHaveSection) {
      console.log(`  Skipping "${sectionKey}" — already translated in all languages`);
      continue;
    }

    console.log(`\n  Translating "${sectionKey}" (${JSON.stringify(section).length} chars)...`);
    
    const langCodes = targetLangs.map(l => l.code).join(", ");
    const langNames = targetLangs.map(l => `${l.code}: ${l.name}`).join("\n");

    const prompt = `Translate the following JSON section from English into ALL of these languages:

Target languages:
${langNames}

ONLY translate the STRING values. Keep all keys and structure identical.
Use proper financial terminology in each language.
Return a JSON object where top-level keys are language codes and values are the translated section.

Example format:
{
  "fr": { "key1": "translated value", ... },
  "de": { "key1": "translated value", ... },
  ...
}

Source section to translate (key: ${sectionKey}):
${JSON.stringify(section, null, 2)}

Return ONLY the JSON object, no markdown.`;

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: "You are a professional financial translator. Return ONLY valid JSON." },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 8192,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in response");

        const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));

        // Apply translations to each language
        let appliedCount = 0;
        for (const lang of targetLangs) {
          if (parsed[lang.code]) {
            // The response might use full language codes or just the section
            const translation = parsed[lang.code];
            if (typeof translation === "object" && translation !== null) {
              results[lang.code][sectionKey] = translation;
              appliedCount++;
            }
          }
        }

        console.log(`  ✓ Applied to ${appliedCount}/${targetLangs.length} languages`);
        success = true;
        
        // Save progress after each section
        for (const lang of targetLangs) {
          writeFileSync(resolve(LOCALES_DIR, `${lang.code}.json`), JSON.stringify(results[lang.code], null, 2) + "\n", "utf-8");
        }
        break;
      } catch (err) {
        console.error(`  Attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt < 2) await sleep(3000);
      }
    }

    if (!success) {
      console.error(`  ✗ Failed to translate "${sectionKey}" after 3 attempts`);
    }

    await sleep(1000);
  }

  // Fill any missing sections with English fallback
  for (const lang of targetLangs) {
    const result = results[lang.code];
    for (const key of sectionKeys) {
      if (result[key] === undefined) {
        console.warn(`  ⚠ ${lang.code} missing "${key}" — filling with English`);
        result[key] = sourceObj[key];
      }
    }
    writeFileSync(resolve(LOCALES_DIR, `${lang.code}.json`), JSON.stringify(result, null, 2) + "\n", "utf-8");
  }

  console.log("\n✓ All translations complete!");
  return results;
}

async function main() {
  if (!API_KEY) {
    console.error("ERROR: DEEPSEEK_API_KEY not set");
    process.exit(1);
  }

  console.log("Starting batch translation...\n");
  await translateSections();

  // Verify
  console.log("\n--- Verification ---");
  const enKeys = Object.keys(JSON.parse(readFileSync(resolve(LOCALES_DIR, "en.json"), "utf-8")));
  for (const lang of REMAINING_LANGUAGES.filter(l => !EXISTING_CODES.includes(l.code))) {
    const path = resolve(LOCALES_DIR, `${lang.code}.json`);
    if (existsSync(path)) {
      const obj = JSON.parse(readFileSync(path, "utf-8"));
      const missingKeys = enKeys.filter(k => obj[k] === undefined);
      if (missingKeys.length > 0) {
        console.log(`  ⚠ ${lang.code}: missing keys: ${missingKeys.join(", ")}`);
      } else {
        console.log(`  ✓ ${lang.code}: all ${enKeys.length} keys present (${Object.keys(obj).length} sections)`);
      }
    } else {
      console.log(`  ✗ ${lang.code}: file not found`);
    }
  }
}

main().catch(console.error);
