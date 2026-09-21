#!/usr/bin/env bash
# Exit on error
set -o errexit

# Instalar dependencias de Node
npm install

# Instalar dependencias de sistema para que Puppeteer/Chrome funcione en Linux
apt-get update && apt-get install -y wget gnupg
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update
apt-get install -y google-chrome-stable libxss1
