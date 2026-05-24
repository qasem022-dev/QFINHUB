#!/bin/bash
# QFINHUB Blog Agent — Daily SEO-optimized blog post
# Generates post, commits, and pushes to deploy on Vercel
set -euo pipefail

cd /home/admin1/qfinhub

# Run the blog agent
echo "📝 Running blog agent..."
node scripts/blog-agent.cjs 2>&1

# Commit and push to trigger Vercel deployment
if git diff --quiet src/lib/blog/posts.ts; then
  echo "✅ No new post generated (already up to date)"
else
  echo "📤 Committing and deploying..."
  git add src/lib/blog/posts.ts
  git commit -m "Blog: daily auto-post $(date +%Y-%m-%d)" || true
  git push
  echo "✅ Blog post deployed!"
fi
