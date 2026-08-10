const QRCode = require("qrcode");
const fs = require("fs");

QRCode.toString("exp://192.168.1.11:8081", { type: "terminal", small: true }, (err, qr) => {
  if (err) { console.error(err); process.exit(1); }
  console.log("\nScan this QR in Expo Go:\n");
  console.log(qr);
  console.log("\nOr open this URL in Expo Go: exp://192.168.1.11:8081\n");
});
