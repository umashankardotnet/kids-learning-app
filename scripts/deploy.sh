#!/usr/bin/env bash
# Builds the site and publishes it to the gh-pages branch.
set -e
GITHUB_PAGES=true npm run build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git commit -q -m "Publish site"
git push -f https://github.com/umashankardotnet/kids-learning-app.git gh-pages
rm -rf .git
