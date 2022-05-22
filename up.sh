#!/bin/bash
docker stop github-desktop
docker rm github-desktop

docker run -dit \
  --name github-desktop \
  -v /Volumes/data/git/github-desktop:/www \
  node:16.13.0
