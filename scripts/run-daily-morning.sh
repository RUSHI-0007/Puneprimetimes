#!/usr/bin/env bash
set -e

DIR="/Users/rushi/Projects/PunePrimeTimes"
cd "$DIR"

# Export Node & Npx to PATH
export PATH="/Users/rushi/.nvm/versions/node/v22.23.3/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Log directory
mkdir -p "$DIR/logs"
LOG_FILE="$DIR/logs/cron-$(date +%Y-%m-%d).log"

echo "==========================================" >> "$LOG_FILE"
echo "⏰ Starting Daily Morning Pipeline at $(date)" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"

# Run the production pipeline with publish flag (5 Pune + 5 Baramati)
npx tsx pipeline/run.ts --publish --pune-stories=5 --baramati-stories=5 >> "$LOG_FILE" 2>&1

# Revalidate production web cache
node -e '
const https = require("https");
["/", "/news", "/admin", "/categories"].forEach((path) => {
  const postData = JSON.stringify({ path });
  const req = https.request(
    "https://www.puneprimetimes.in/api/revalidate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    },
    (res) => console.log(`Revalidated ${path}: ${res.statusCode}`)
  );
  req.write(postData);
  req.end();
});
' >> "$LOG_FILE" 2>&1

echo "✓ Completed Daily Morning Pipeline at $(date)" >> "$LOG_FILE"

