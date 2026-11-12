@echo off
title LegalAI - Local Blockchain Node (Ganache)
color 0B
echo ====================================================
echo     Starting LegalAI Blockchain Node (Ganache)
echo     Port: 8545 (RPC: http://127.0.0.1:8545)
echo ====================================================
echo.
echo Starting Ganache local Ethereum testnet...
echo Keep this window open while using blockchain verification.
echo.
npx ganache --port 8545
pause
