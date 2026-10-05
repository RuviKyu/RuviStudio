#!/usr/bin/env bash
# RUVI Conductor SPECIAL - launcher (macOS / Linux). Checks the pieces, installs what it can, launches the UI.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"; RT="$ROOT/runtime"; mkdir -p "$RT"
say(){ printf '   %s\n' "$*"; }; step(){ printf '\n== %s\n' "$*"; }; warn(){ printf '   ! %s\n' "$*"; }
step "Node.js"
NODE="$(command -v node || true)"
if [ -n "$NODE" ]; then V="$(node --version | sed 's/v//' | cut -d. -f1)"; [ "$V" -ge 18 ] || { warn "Node $V is too old (need 18+)"; NODE=""; }; fi
if [ -z "$NODE" ]; then
  OS="$(uname -s)"; ARCH="$(uname -m)"; case "$ARCH" in x86_64) A=x64;; arm64|aarch64) A=arm64;; *) A=x64;; esac
  case "$OS" in Darwin) P=darwin;; *) P=linux;; esac
  VER="$(curl -fsSL https://nodejs.org/dist/index.json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log(j.find(x=>typeof x.lts==="string").version)})' 2>/dev/null || curl -fsSL https://nodejs.org/dist/index.json | grep -o '"version":"v[0-9.]*","date":"[^"]*","files":\[[^]]*\],"npm":"[^"]*","v8":"[^"]*","uv":"[^"]*","zlib":"[^"]*","openssl":"[^"]*","modules":"[^"]*","lts":"[A-Za-z]*"' | head -1 | grep -o 'v[0-9.]*' | head -1)"
  say "fetching portable Node $VER"; curl -fsSL "https://nodejs.org/dist/$VER/node-$VER-$P-$A.tar.gz" -o "$RT/node.tgz"; mkdir -p "$RT/node"; tar -xzf "$RT/node.tgz" -C "$RT/node" --strip-components=1; rm "$RT/node.tgz"
  NODE="$RT/node/bin/node"; export PATH="$RT/node/bin:$PATH"
fi
say "node $($NODE --version) -> $NODE"
step "renderer package"
if [ ! -f "$ROOT/node_modules/puppeteer-core/package.json" ]; then (cd "$ROOT" && npm install --omit=dev --no-audit --no-fund --loglevel=error); fi; say "puppeteer-core present"
step "ffmpeg"
FF="$(command -v ffmpeg || true)"; FP="$(command -v ffprobe || true)"
[ -x "$RT/ffmpeg/ffmpeg" ] && FF="$RT/ffmpeg/ffmpeg" && FP="$RT/ffmpeg/ffprobe"
if [ -z "$FF" ] || [ -z "$FP" ]; then
  if [ "$(uname -s)" = "Linux" ]; then say "fetching a static ffmpeg (johnvansickle)"; curl -fsSL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o "$RT/ff.txz"; mkdir -p "$RT/ff_tmp"; tar -xJf "$RT/ff.txz" -C "$RT/ff_tmp"; mkdir -p "$RT/ffmpeg"; cp "$(find "$RT/ff_tmp" -name ffmpeg -type f | head -1)" "$RT/ffmpeg/ffmpeg"; cp "$(find "$RT/ff_tmp" -name ffprobe -type f | head -1)" "$RT/ffmpeg/ffprobe"; rm -rf "$RT/ff_tmp" "$RT/ff.txz"; FF="$RT/ffmpeg/ffmpeg"; FP="$RT/ffmpeg/ffprobe"
  else warn "ffmpeg not found - install it (brew install ffmpeg) and run this again"; exit 1; fi
fi
say "ffmpeg -> $FF"
step "Chrome"
CH=""; for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium; do [ -x "$c" ] && CH="$c" && break; done
RTC="$(find -L "$RT/chrome" -type f \( -name chrome -o -name 'Google Chrome for Testing' \) 2>/dev/null | head -1)"; [ -n "$RTC" ] && CH="$RTC"
if [ -z "$CH" ]; then say "fetching Chrome for Testing (about 150 MB)"; (cd "$ROOT" && npx --yes --package=@puppeteer/browsers browsers install chrome@stable --path "$RT/chrome" >/dev/null); CH="$(find -L "$RT/chrome" -type f \( -name chrome -o -name 'Google Chrome for Testing' \) | head -1)"; fi
say "browser -> $CH"
step "fonts"; warn "install Pirata One (Google Fonts) and Algerian (Office) system-wide if the cards / map labels should use them"
step "config"; PORT="$($NODE "$ROOT/tools/setup.js" --ffmpeg "$FF" --ffprobe "$FP" --chrome "$CH")"; say "port $PORT"
step "launch"
if ! (exec 3<>/dev/tcp/127.0.0.1/$PORT) 2>/dev/null; then (cd "$ROOT" && nohup "$NODE" studio.js > "$RT/studio.log" 2>&1 &); for i in $(seq 1 40); do (exec 3<>/dev/tcp/127.0.0.1/$PORT) 2>/dev/null && break; sleep 0.5; done; fi
URL="http://localhost:$PORT"; say "$URL"; (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") || true
