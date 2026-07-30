#!/bin/bash
# QFINHUB Blog Agent v2 — Daily Quality-First Blog Post
# Run daily to generate + commit + deploy one high-quality blog post.
# Re-enabled 2026-07-30 after quality-first rewrite (see blog-agent.cjs).
set -euo pipefail

cd /home/admin1/qfinhub

echo "📝 Running blog agent v2 (quality-first)..."
node scripts/blog-agent.cjs 2>&1 | tee /tmp/blog-agent-daily.log

# Commit and push if posts.ts changed
if git diff --quiet src/lib/blog/posts.ts; then
  echo "✅ No new post generated (already up to date or quality gate failed)"
  exit 0
fi

echo "📤 Committing and deploying..."
git add src/lib/blog/posts.ts
git commit -m "Blog: $(date +%Y-%m-%d) auto-post" || true
git push origin main
echo "✅ Blog post deployed!"