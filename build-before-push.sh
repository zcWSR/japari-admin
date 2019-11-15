#!/bin/sh
echo 'build before push'
npm run build
git add .
commit="build: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "${commit}" --allow-empty
git push origin master
exit 0