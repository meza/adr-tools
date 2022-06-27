#!/bin/sh

PKG_VERSION=$(node -p "require('./package.json').version")
echo "export const LIB_VERSION = '${PKG_VERSION}';\n" > $1
