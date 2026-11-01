#!/bin/sh
exec env NODE_ENV=development node --import tsx --watch-path=./src ./src/index.ts
