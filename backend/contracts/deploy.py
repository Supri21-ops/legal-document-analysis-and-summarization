#!/usr/bin/env python3
"""
Deploy DocumentVerification smart contract to Ganache local testnet.

Usage:
    cd backend
    venv\\Scripts\\activate        (Windows)
    python contracts/deploy.py
"""

import json
import os
import sys
from pathlib import Path


def deploy_contract():
    try:
        from web3 import Web3
    except ImportError:
        print("Installing web3...")
        os.system("pip install web3")
        from web3 import Web3

    try:
        from solcx import compile_source, install_solc
    except ImportError:
        print("Installing py-solc-x...")
        os.system("pip install py-solc-x")
        from solcx import compile_source, install_solc

    # ── Connect to Ganache ────────────────────────────────────────────────────
    ganache_url = os.getenv("GANACHE_URL", "http://127.0.0.1:8545")
    w3 = Web3(Web3.HTTPProvider(ganache_url))

    if not w3.is_connected():
        print("\n❌ Cannot connect to Ganache!")
        print("   Start Ganache first:")
        print("   npm install -g ganache")
        print("   ganache --port 8545 --deterministic\n")
        sys.exit(1)

    print(f"✅ Connected to Ganache at {ganache_url}")
    print(f"   Chain ID    : {w3.eth.chain_id}")
    print(f"   Block Number: {w3.eth.block_number}")
    print(f"   Accounts    : {len(w3.eth.accounts)} available")
    print(f"   Deployer    : {w3.eth.accounts[0]}")

    # ── Install Solidity compiler ─────────────────────────────────────────────
    print("\n📦 Installing Solidity compiler v0.8.19...")
    install_solc("0.8.19")
    print("   Done.")

    # ── Read source ───────────────────────────────────────────────────────────
    contract_path = Path(__file__).parent / "DocumentVerification.sol"
    if not contract_path.exists():
        print(f"❌ Contract not found at {contract_path}")
        sys.exit(1)

    with open(contract_path, "r") as f:
        source = f.read()

    # ── Compile ───────────────────────────────────────────────────────────────
    print("\n🔨 Compiling DocumentVerification.sol...")
    compiled = compile_source(
        source,
        output_values=["abi", "bin"],
        solc_version="0.8.19"
    )
    contract_id        = "<stdin>:DocumentVerification"
    contract_interface = compiled[contract_id]
    print(f"   ABI entries : {len(contract_interface['abi'])}")
    print(f"   Bytecode len: {len(contract_interface['bin'])} chars")

    # ── Deploy ────────────────────────────────────────────────────────────────
    print("\n🚀 Deploying contract...")
    account = w3.eth.accounts[0]

    Contract = w3.eth.contract(
        abi=contract_interface["abi"],
        bytecode=contract_interface["bin"]
    )

    tx_hash = Contract.constructor().transact({
        "from": account,
        "gas": 3_000_000
    })
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = receipt["contractAddress"]

    print(f"\n✅ Contract deployed successfully!")
    print(f"   Contract Address : {contract_address}")
    print(f"   Transaction Hash : {tx_hash.hex()}")
    print(f"   Block Number     : {receipt['blockNumber']}")
    print(f"   Gas Used         : {receipt['gasUsed']:,}")

    # ── Quick smoke-test ──────────────────────────────────────────────────────
    print("\n🧪 Running smoke test...")
    instance = w3.eth.contract(
        address=contract_address,
        abi=contract_interface["abi"]
    )
    total = instance.functions.getTotalDocuments().call()
    print(f"   getTotalDocuments() → {total}  ✅")

    # ── Save deployment info ──────────────────────────────────────────────────
    deployment = {
        "contract_address":  contract_address,
        "transaction_hash":  tx_hash.hex(),
        "block_number":      receipt["blockNumber"],
        "gas_used":          receipt["gasUsed"],
        "network":           "Ganache Local Testnet",
        "chain_id":          w3.eth.chain_id,
        "deployer":          account,
        "abi":               contract_interface["abi"]
    }

    out_path = Path(__file__).parent / "deployment.json"
    with open(out_path, "w") as f:
        json.dump(deployment, f, indent=2)
    print(f"\n💾 Deployment info saved to: {out_path}")

    # ── Instruct user ─────────────────────────────────────────────────────────
    print("\n" + "─" * 55)
    print("📝 Add this to your backend\\.env file:")
    print(f"   CONTRACT_ADDRESS={contract_address}")
    print("─" * 55)
    print("\nThen restart the backend server.\n")

    return contract_address


if __name__ == "__main__":
    deploy_contract()
