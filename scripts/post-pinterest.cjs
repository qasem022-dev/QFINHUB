#!/usr/bin/env node
// QFINHUB Pinterest Auto-Pinner
// Usage:
//   node scripts/post-pinterest.cjs          Post next pin in queue (with infographic)
//   node scripts/post-pinterest.cjs --setup   Create boards + test connection
//   node scripts/post-pinterest.cjs --list    List existing boards
//
// Requires: pinterest-content.cjs to have been run (for content & images)

const { readFileSync, writeFileSync, existsSync } = require("fs");
const { resolve } = require("path");

// Load .env.local
try {
  var envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  envContent.split("\n").forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      var key = match[1].trim();
      var val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch(e) {
  console.error("Could not load .env.local");
}

const DATA_DIR = resolve(__dirname, "..", ".pinterest-data");
const LOG_FILE = resolve(DATA_DIR, "pin-log.json");
const POST_LOG_FILE = resolve(DATA_DIR, "post-log.json");
const PINTEREST_API = "https://api.pinterest.com/v5";

// ─── Pinterest API helpers ───

function getAccessToken() {
  return process.env.PINTEREST_ACCESS_TOKEN || "";
}

function getHeaders() {
  var token = getAccessToken();
  if (!token) {
    console.error("PINTEREST_ACCESS_TOKEN not set in .env.local");
    process.exit(1);
  }
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}

async function pinterestRequest(method, path, body, retries) {
  retries = retries || 2;
  var url = PINTEREST_API + path;
  var options = { method: method, headers: getHeaders() };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  
  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      var resp = await fetch(url, options);
      
      if (!resp.ok) {
        var errText = await resp.text().catch(function() { return ""; });
        var errMsg = "Pinterest " + resp.status + ": " + errText.substring(0, 200);
        
        if (resp.status === 429) {
          console.log("Rate limited. Waiting 60s...");
          await sleep(60000);
          continue;
        }
        
        throw new Error(errMsg);
      }
      
      if (resp.status === 204) return {};
      return await resp.json();
    } catch(e) {
      if (attempt < retries && !e.message.includes("401") && !e.message.includes("403")) {
        console.log("Retrying (" + (attempt + 1) + "/" + retries + "): " + (e.message || "").substring(0, 60));
        await sleep(3000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
}

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ─── Boards ───

async function listBoards() {
  var data = await pinterestRequest("GET", "/boards?page_size=50");
  return data.items || [];
}

async function createBoard(name, description) {
  var data = await pinterestRequest("POST", "/boards", {
    name: name,
    description: description || "Financial calculators and tools by QFINHUB",
    privacy: "PUBLIC"
  });
  return data;
}

async function getOrCreateBoard(name, description) {
  var boards = await listBoards();
  for (var i = 0; i < boards.length; i++) {
    if (boards[i].name.toLowerCase() === name.toLowerCase()) {
      console.log("Found existing board: " + name + " (" + boards[i].id + ")");
      return boards[i];
    }
  }
  console.log("Creating board: " + name);
  return await createBoard(name, description);
}

// ─── Pins ───

async function createPin(boardId, title, description, link, imagePath) {
  // Upload image to our own public directory first
  // Or use Pinterest media upload
  console.log("Creating pin on board: " + boardId);
  
  // First upload the image to Pinterest media endpoint
  var mediaData = await pinterestRequest("POST", "/media", {
    media_type: "images"
  });
  
  // Register our image URL after uploading
  // Actually, let's use image_url source type directly since the image will be hosted
  // For now, we'll try to upload the image
  
  var pinData = {
    board_id: boardId,
    title: (title || "").substring(0, 100),  // Pinterest max 100 chars
    description: (description || "").substring(0, 500),  // Pinterest max 500 chars
    link: link,
    alt_text: "Financial infographic from QFINHUB"
  };

  // Try to include image - Pinterest requires image
  // Approach: save image to public/ and use as URL source
  if (imagePath && existsSync(imagePath)) {
    pinData.media_source = {
      source_type: "image_url",
      url: "https://www.qfinhub.com/pinterest-images/" + imagePath.split("/").pop()
    };
  }

  return await pinterestRequest("POST", "/pins", pinData);
}

// ─── Setup: Create all boards ───

async function setupBoards() {
  console.log("=== Pinterest Board Setup ===");
  console.log("");
  
  var boards = await listBoards();
  console.log("Existing boards: " + boards.length);
  boards.forEach(function(b) {
    console.log("  - " + b.name + " (" + b.id + ")");
  });
  
  console.log("");
  console.log("Creating category boards...");
  
  var categories = [
    { name: "Mortgage Calculators", desc: "Free mortgage calculators, home affordability, refinance, and closing cost tools" },
    { name: "Investment Calculators", desc: "Compound interest, ROI, stock returns, and portfolio analysis calculators" },
    { name: "Retirement Planning", desc: "401k, Roth IRA, Social Security, and retirement savings calculators" },
    { name: "Loan Calculators", desc: "Auto, student, personal loan calculators and comparison tools" },
    { name: "Debt Payoff Tools", desc: "Debt snowball, avalanche, and payoff calculators to become debt-free" },
    { name: "Tax Calculators", desc: "Income tax, capital gains, property tax, and bracket calculators" },
    { name: "Savings & Budget", desc: "Budget planner, savings goal, net worth, and inflation calculators" },
    { name: "Everyday Calculators", desc: "Free online calculators for daily life: tips, discounts, currency, BMI, and more" },
  ];
  
  var created = [];
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    try {
      var board = await getOrCreateBoard(c.name, c.desc);
      created.push(board);
      console.log("  ✅ " + c.name);
    } catch(e) {
      console.log("  ❌ " + c.name + " — " + e.message.substring(0, 80));
    }
    await sleep(500); // Rate limit buffer
  }
  
  console.log("");
  console.log("Setup complete. " + created.length + " boards ready.");
  
  // Save board mapping
  var boardMap = {};
  created.forEach(function(b) {
    var key = b.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    boardMap[key] = { id: b.id, name: b.name };
  });
  
  writeFileSync(resolve(DATA_DIR, "boards.json"), JSON.stringify(boardMap, null, 2));
  console.log("Board mapping saved to .pinterest-data/boards.json");
}

// ─── Post a pin ───

async function postPin() {
  console.log("=== Pinterest Auto-Pinner ===");
  console.log("");
  
  var accessToken = getAccessToken();
  if (!accessToken) {
    console.error("❌ No Pinterest access token in .env.local");
    console.log("Add: PINTEREST_ACCESS_TOKEN=your_token_here");
    process.exit(1);
  }
  console.log("✅ Access token loaded");
  
  // Load pin content from content generator
  var logPath = LOG_FILE;
  if (!existsSync(logPath)) {
    console.error("❌ No pin log found. Run pinterest-content.cjs --generate first.");
    process.exit(1);
  }
  
  var pinLog = JSON.parse(readFileSync(logPath, "utf-8"));
  var pendingPins = pinLog.pins || [];
  
  // Find unposted pins by checking post log
  var postLog = { posts: [] };
  if (existsSync(POST_LOG_FILE)) {
    try { postLog = JSON.parse(readFileSync(POST_LOG_FILE, "utf-8")); } catch(e) {}
  }
  var postedSlugs = new Set();
  (postLog.posts || []).forEach(function(p) { postedSlugs.add(p.slug); });
  
  // Filter to unposted pins that have images
  var unposted = pendingPins.filter(function(p) { return !postedSlugs.has(p.slug) && p.imagePath && existsSync(p.imagePath); });
  
  if (unposted.length === 0) {
    console.log("No unposted pins with images. Generating new content...");
    // Content generator already ran — check if images were generated
    console.log("Tip: Run: node scripts/pinterest-content.cjs --generate");
    process.exit(1);
  }
  
  var pinToPost = unposted[0];
  console.log("Posting pin: " + pinToPost.slug);
  console.log("  Title: " + pinToPost.title);
  console.log("  Board: " + pinToPost.boardName);
  console.log("  Image: " + (pinToPost.imagePath || "(none)"));
  
  // Get board ID
  var boardMap = {};
  var boardMapPath = resolve(DATA_DIR, "boards.json");
  if (existsSync(boardMapPath)) {
    boardMap = JSON.parse(readFileSync(boardMapPath, "utf-8"));
  }
  
  var boardKey = pinToPost.category || "savings-and-budget";
  var boardId = boardMap[boardKey] ? boardMap[boardKey].id : null;
  
  if (!boardId) {
    // Try to find board by name
    try {
      var boards = await listBoards();
      var matchingBoard = boards.find(function(b) {
        return b.name.toLowerCase().includes(pinToPost.boardName.toLowerCase());
      });
      if (matchingBoard) boardId = matchingBoard.id;
    } catch(e) {
      console.error("Could not find board: " + e.message);
    }
    
    if (!boardId) {
      console.error("Could not find board for: " + pinToPost.boardName);
      console.log("Run: node scripts/post-pinterest.cjs --setup");
      process.exit(1);
    }
  }
  
  console.log("  Board ID: " + boardId);
  
  // Copy image to public directory for hosting
  var fs = require("fs");
  var pathModule = require("path");
  var publicPinDir = resolve(__dirname, "..", "public", "pinterest-images");
  if (!existsSync(publicPinDir)) {
    fs.mkdirSync(publicPinDir, { recursive: true });
  }
  
  var imageFilename = pathModule.basename(pinToPost.imagePath);
  var publicImagePath = resolve(publicPinDir, imageFilename);
  fs.copyFileSync(pinToPost.imagePath, publicImagePath);
  var imageUrl = "https://www.qfinhub.com/pinterest-images/" + imageFilename;
  console.log("  Image URL: " + imageUrl);
  
  // Create the pin
  try {
    var pinBody = {
      board_id: boardId,
      title: (pinToPost.title || pinToPost.slug).substring(0, 100),
      description: (pinToPost.description || "Try our free " + (pinToPost.slug || "").split("-").join(" ") + " calculator at QFINHUB").substring(0, 500),
      link: pinToPost.link || "https://www.qfinhub.com/calculators/" + (pinToPost.slug || ""),
      alt_text: "Financial calculator infographic from QFINHUB",
      media_source: {
        source_type: "image_url",
        url: imageUrl
      }
    };
    
    console.log("  Sending to Pinterest API...");
    var result = await pinterestRequest("POST", "/pins", pinBody);
    
    console.log("");
    console.log("✅ PIN POSTED SUCCESSFULLY");
    console.log("  Pin ID: " + (result.id || "unknown"));
    console.log("  URL: https://www.pinterest.com/pin/" + (result.id || ""));
    
    // Log to post log
    postLog.posts.push({
      slug: pinToPost.slug,
      pinId: result.id,
      title: pinToPost.title,
      boardName: pinToPost.boardName,
      imageUrl: imageUrl,
      time: new Date().toISOString()
    });
    
    // Trim log to last 200 entries
    if (postLog.posts.length > 200) {
      postLog.posts = postLog.posts.slice(-200);
    }
    
    writeFileSync(POST_LOG_FILE, JSON.stringify(postLog, null, 2));
    
    // Also save the image URL so we can reuse it
    var imagesLog = resolve(DATA_DIR, "hosted-images.json");
    var hostedImages = {};
    if (existsSync(imagesLog)) {
      try { hostedImages = JSON.parse(fs.readFileSync(imagesLog, "utf-8")); } catch(e) {}
    }
    hostedImages[pinToPost.slug] = { url: imageUrl, time: new Date().toISOString() };
    writeFileSync(imagesLog, JSON.stringify(hostedImages, null, 2));
    
  } catch(e) {
    console.error("");
    console.error("❌ PINTEREST POST FAILED");
    console.error("  Error: " + (e.message || e || "unknown"));
    console.error("");
    
    // If token expired, suggest OAuth refresh
    if (e.message.includes("401") || e.message.includes("expired")) {
      console.log("  Token may be expired. Generate a new one at:");
      console.log("  https://developers.pinterest.com/apps/" + (process.env.PINTEREST_CLIENT_ID || "1570427") + "/");
      console.log("  Then set PINTEREST_ACCESS_TOKEN in .env.local");
    }
    
    // Log failure
    postLog.failed = postLog.failed || [];
    postLog.failed.push({
      slug: pinToPost.slug,
      error: (e.message || String(e)).substring(0, 200),
      time: new Date().toISOString()
    });
    writeFileSync(POST_LOG_FILE, JSON.stringify(postLog, null, 2));
  }
}

// ─── Main dispatcher ───
async function main() {
  var args = process.argv.slice(2);
  
  if (args.includes("--setup")) {
    await setupBoards();
  } else if (args.includes("--list")) {
    var boards = await listBoards();
    console.log("=== Pinterest Boards (" + boards.length + ") ===");
    boards.forEach(function(b) {
      console.log("  📌 " + b.name + " (" + b.id + ")");
    });
  } else {
    await postPin();
  }
}

main().catch(function(err) {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
