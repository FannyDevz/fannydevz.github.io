#!/bin/bash
# Build APK tanpa Gradle: aapt2 -> javac -> d8 -> zipalign -> apksigner
set -euo pipefail
cd "$(dirname "$0")"

SDK="$HOME/Library/Android/sdk"
BT="$SDK/build-tools/36.0.0"
JAR="$SDK/platforms/android-34/android.jar"
OUT=build
rm -rf "$OUT"
mkdir -p "$OUT/classes" "$OUT/compiled"

if [ ! -f assets/dmsans.ttf ]; then
  mkdir -p assets
  curl -fsSL --max-time 60 -o assets/dmsans.ttf \
    'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf'
fi

"$BT/aapt2" compile --dir res -o "$OUT/compiled/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest AndroidManifest.xml \
  -A assets --java "$OUT/gen" "$OUT/compiled/res.zip"

javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$JAR:$BT/core-lambda-stubs.jar" \
  -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java')
"$BT/d8" --lib "$JAR" --min-api 26 --output "$OUT" $(find "$OUT/classes" -name '*.class')

(cd "$OUT" && zip -q -j base.apk classes.dex)
"$BT/zipalign" -f 4 "$OUT/base.apk" "$OUT/aligned.apk"

[ -f neo.keystore ] || keytool -genkeypair -keystore neo.keystore -storepass "$NEO_KS_PASS" \
  -keypass "$NEO_KS_PASS" -alias neo -keyalg RSA -keysize 2048 -validity 10000 \
  -dname 'CN=Neo Launcher' >/dev/null 2>&1
"$BT/apksigner" sign --ks neo.keystore --ks-pass "pass:$NEO_KS_PASS" \
  --out neo-launcher.apk "$OUT/aligned.apk"
ls -la neo-launcher.apk
