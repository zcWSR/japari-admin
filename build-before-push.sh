#!/bin/sh
echo 'build before push......'
npm run build
git add ./built

git status -s ./built
changedFile=$?
if [ ! $changeFile ]; then
  echo 'file changed, do commit'
  commit="build: $(date '+%Y-%m-%d %H:%M:%S')"
  git commit -m "${commit}" --allow-empty
else
  echo 'file not changed, ignore'
fi
