@echo off
cd /d F:\zorixa-ai
git add app/reviews components/reviews components/seo/review-page-json-ld.tsx lib/review-pages-catalog.ts app/sitemap.ts components/layout/Footer.tsx proxy.ts
git commit -F tmp\commit-msg.txt
