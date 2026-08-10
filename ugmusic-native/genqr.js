const QRCode = require("qrcode");
QRCode.toFile("qr.png", "exp://192.168.1.11:8081", { width: 400 }, (err) => {
  if (err) console.error(err);
  else console.log("QR saved");
});
