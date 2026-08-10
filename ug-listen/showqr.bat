@echo off
cd /d "I:\Ugandan Music Platform\ug-listen"
echo.
echo Scan with Expo Go - URL: exp://192.168.1.11:8081
echo.
node -e "const Q=require('qrcode');Q.toString('exp://192.168.1.11:8081',{type:'utf8',errorCorrectionLevel:'L'},function(e,q){if(e)console.error(e);else console.log(q)})"
echo.
pause
