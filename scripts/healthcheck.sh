#!/bin/sh

ENDPOINT="${1:-http://localhost:3000}"

echo "Health check: $ENDPOINT"

# Check app
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ App: OK ($HTTP_CODE)"
else
    echo "✗ App: FAILED ($HTTP_CODE)"
    exit 1
fi

# Check DB via health endpoint or direct
if curl -s "$ENDPOINT/api/health" | grep -q "ok"; then
    echo "✓ API: OK"
else
    echo "✗ API: FAILED"
    exit 1
fi

echo "All checks passed."
