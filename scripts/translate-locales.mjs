/**
 * Multi-Language Translation Pipeline
 * Translates all UI locale strings from English to 30+ languages
 * using the DeepSeek API.
 *
 * Usage: node scripts/translate-locales.mjs
 * 
 * This script is fully autonomous:
 * - Reads en.json as source of truth
 * - Translates to all target languages
 * - Fills in missing keys for existing translations (es, hi)
 * - Saves all locale files with proper JSON formatting
 * - Handles API errors gracefully with retries
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../src/i18n/locales");

// ─── Configuration ─────────────────────────────────────────

const TARGET_LANGUAGES = [
  // Already exist (but may need updates)
  { code: "es", name: "Spanish", nativeName: "Español", exists: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", exists: true },

  // New translations
  { code: "fr", name: "French", nativeName: "Français", exists: false },
  { code: "de", name: "German", nativeName: "Deutsch", exists: false },
  { code: "it", name: "Italian", nativeName: "Italiano", exists: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", exists: false },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", exists: false },
  { code: "pl", name: "Polish", nativeName: "Polski", exists: false },
  { code: "sv", name: "Swedish", nativeName: "Svenska", exists: false },
  { code: "no", name: "Norwegian", nativeName: "Norsk", exists: false },
  { code: "da", name: "Danish", nativeName: "Dansk", exists: false },
  { code: "fi", name: "Finnish", nativeName: "Suomi", exists: false },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", exists: false },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", exists: false },
  { code: "ru", name: "Russian", nativeName: "Русский", exists: false },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", exists: false },
  { code: "ro", name: "Romanian", nativeName: "Română", exists: false },
  { code: "cs", name: "Czech", nativeName: "Čeština", exists: false },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", exists: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", exists: false },
  { code: "he", name: "Hebrew", nativeName: "עברית", exists: false },
  { code: "ur", name: "Urdu", nativeName: "اردو", exists: false },
  { code: "zh", name: "Chinese Simplified", nativeName: "简体中文", exists: false },
  { code: "zh-TW", name: "Chinese Traditional", nativeName: "繁體中文", exists: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", exists: false },
  { code: "ko", name: "Korean", nativeName: "한국어", exists: false },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", exists: false },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", exists: false },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", exists: false },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", exists: false },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", exists: false },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", exists: false },
];

// DeepSeek API config
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_PRO_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

// Chunk size for splitting large JSON into smaller sections to avoid token limits
const CHUNK_SIZE = 50; // keys per chunk

// ─── Helpers ─────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function flattenObject(obj, prefix = "") {
  const result = {};
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

function unflattenObject(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function countLeafValues(obj) {
  let count = 0;
  for (const val of Object.values(obj)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      count += countLeafValues(val);
    } else {
      count++;
    }
  }
  return count;
}

// ─── DeepSeek Translation ─────────────────────────

async function translateChunk(chunks, targetLang, retries = 3) {
  const jsonStr = JSON.stringify(chunks, null, 2);

  const systemPrompt = `You are a professional financial translator. Translate the following JSON object from English to ${targetLang.name} (${targetLang.code}).

RULES:
1. Translate ONLY the string VALUES — NEVER translate the keys
2. Preserve all JSON structure exactly
3. Use proper financial terminology in ${targetLang.name}
4. Keep numbers, URLs, and HTML entities unchanged
5. For template strings like "{count} calculators", translate the surrounding text but keep the variables
6. Maintain the same tone: professional, helpful, clear
7. Return ONLY valid JSON — no markdown, no explanation

Example:
Input: {"hello": "Welcome", "stats": {"calculators": "Calculators"}}
Output: {"hello": "Bienvenido", "stats": {"calculators": "Calculadoras"}}`;

  const userPrompt = `Translate this JSON to ${targetLang.name} (${targetLang.code}). Return ONLY the translated JSON:\n\n${jsonStr}`;

  for (let attempt = 0; attempt < retries; attempt++) {
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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      // Extract JSON
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      return parsed;
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt < retries - 1) {
        const wait = 2000 * (attempt + 1);
        console.log(`  Retrying in ${wait}ms...`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

// ─── Main Translation Logic ─────────────────────────

async function translateLocale(sourceObj, targetLang) {
  const flat = flattenObject(sourceObj);
  const keys = Object.keys(flat);
  const totalValues = keys.length;
  const chunks = [];
  const translatedFlat = {};

  console.log(`  ${totalValues} values to translate across ${Math.ceil(keys.length / CHUNK_SIZE)} chunks`);

  // Split into chunks
  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    const chunkKeys = keys.slice(i, i + CHUNK_SIZE);
    const chunk = {};
    for (const k of chunkKeys) {
      chunk[k] = flat[k];
    }
    chunks.push(chunk);
  }

  // Translate each chunk
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  Chunk ${i + 1}/${chunks.length} (${Object.keys(chunks[i]).length} values)...`);
    const translated = await translateChunk(chunks[i], targetLang);
    
    // If the response is nested, flatten it
    const translatedFlatChunk = flattenObject(translated);
    Object.assign(translatedFlat, translatedFlatChunk);
    
    console.log(`  ✓ Chunk ${i + 1} done`);
    
    // Rate limiting
    if (i < chunks.length - 1) {
      await sleep(1500);
    }
  }

  // Verify all keys were translated
  const missingKeys = keys.filter((k) => !(k in translatedFlat));
  if (missingKeys.length > 0) {
    console.warn(`  ⚠ ${missingKeys.length} keys missing after translation: ${missingKeys.slice(0, 5).join(", ")}${missingKeys.length > 5 ? "..." : ""}`);
    // Fill missing with original
    for (const k of missingKeys) {
      translatedFlat[k] = flat[k];
    }
  }

  // Unflatten back to nested structure
  return unflattenObject(translatedFlat);
}

// ─── Fix Existing Translations (fill missing keys) ─────────

async function fixExistingTranslation(existingObj, sourceObj, targetLang) {
  let modified = false;

  function fillMissing(existing, source, path = "") {
    for (const key of Object.keys(source)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (!(key in existing)) {
        console.log(`  Missing key "${fullPath}" — filling with translation`);
        existing[key] = source[key];
        modified = true;
      } else if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
        if (typeof existing[key] !== "object" || existing[key] === null || Array.isArray(existing[key])) {
          existing[key] = {};
          modified = true;
        }
        fillMissing(existing[key], source[key], fullPath);
      }
    }
    return existing;
  }

  return fillMissing(existingObj, sourceObj);
}

// ─── Main ─────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error("ERROR: DEEPSEEK_API_KEY environment variable not set.");
    console.error("Set it with: export DEEPSEEK_API_KEY=your_key_here");
    process.exit(1);
  }

  // Read source English file
  console.log("Reading source locale (en.json)...");
  const sourcePath = resolve(LOCALES_DIR, "en.json");
  const sourceObj = JSON.parse(readFileSync(sourcePath, "utf-8"));
  const totalKeys = countLeafValues(sourceObj);
  console.log(`Source has ${totalKeys} translatable values\n`);

  let successCount = 0;
  let failCount = 0;

  for (const lang of TARGET_LANGUAGES) {
    const filePath = resolve(LOCALES_DIR, `${lang.code}.json`);
    console.log(`\n━━━ ${lang.name} (${lang.code}) ━━━`);

    try {
      if (lang.exists && existsSync(filePath)) {
        // Existing locale — check for missing keys and fill
        console.log("  Existing translation detected. Checking for missing keys...");
        const existingObj = JSON.parse(readFileSync(filePath, "utf-8"));
        const result = fixExistingTranslation(existingObj, sourceObj, lang);
        
        // Count how many new keys were added
        const existingKeys = countLeafValues(existingObj);
        const newKeys = countLeafValues(result);
        
        if (newKeys > existingKeys) {
          console.log(`  Added ${newKeys - existingKeys} missing keys. Saving...`);
        }
        
        writeFileSync(filePath, JSON.stringify(result, null, 2) + "\n", "utf-8");
        console.log(`  ✓ Saved (${newKeys} values)`);
      } else {
        // New locale — translate from English
        console.log("  Translating from English...");
        const translated = await translateLocale(sourceObj, lang);
        writeFileSync(filePath, JSON.stringify(translated, null, 2) + "\n", "utf-8");
        const translatedKeys = countLeafValues(translated);
        console.log(`  ✓ Saved (${translatedKeys} values)`);
      }
      successCount++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      failCount++;
    }

    // Rate limiting between languages
    await sleep(1000);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Results: ${successCount} success, ${failCount} failed`);
  console.log(`Total languages: ${TARGET_LANGUAGES.length}`);
  console.log(`═══════════════════════════════════════`);
}

main().catch(console.error);
