const QRCode = require("qrcode");
const fs = require("fs");

QRCode.toFile("qr-code.png", "exp://192.168.1.11:8081", { width: 400, margin: 2, color: { dark: "#000", light: "#fff" } }, (err) => {
  if (err) console.error(err);
  else console.log("QR code saved to qr-code.png");
});
