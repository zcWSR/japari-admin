#!/bin/sh
echo 'build before push......'
npm run build
git add ./built

changedFile=`git status -s ./built | grep '^[MARCD]'`
echo $changeFile

if [ -z "$changedFile" ]; then
  echo 'file not changed, ignore'
else
  echo 'file changed, do commit'
  commit="build: $(date '+%Y-%m-%d %H:%M:%S')"
  git commit -m "${commit}"
fi