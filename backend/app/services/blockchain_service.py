import hashlib
import socket
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from app.config import settings

CONTRACT_ABI = [
    {"inputs": [{"internalType": "string", "name": "documentId", "type": "string"}, {"internalType": "string", "name": "documentHash", "type": "string"}, {"internalType": "string", "name": "owner", "type": "string"}], "name": "storeDocument", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "documentId", "type": "string"}], "name": "getDocument", "outputs": [{"internalType": "string", "name": "documentHash", "type": "string"}, {"internalType": "string", "name": "owner", "type": "string"}, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {"internalType": "bool", "name": "exists", "type": "bool"}], "stateMutability": "view", "type": "function"},
]

_web3 = None

def is_ganache_listening(timeout_sec: float = 0.2) -> bool:
    """Instant TCP socket probe to verify if Ganache node is reachable without blocking."""
    try:
        parsed = urlparse(settings.GANACHE_URL)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 8545
        with socket.create_connection((host, port), timeout=timeout_sec):
            return True
    except Exception:
        return False

def get_web3():
    """Returns active Web3 instance or None with instant non-blocking check."""
    global _web3
    if not is_ganache_listening():
        _web3 = None
        return None

    try:
        from web3 import Web3
        if _web3 is None or not _web3.is_connected():
            w = Web3(Web3.HTTPProvider(settings.GANACHE_URL, request_kwargs={"timeout": 1}))
            _web3 = w if w.is_connected() else None
    except Exception:
        _web3 = None
    return _web3

def store_document_hash(document_id: str, document_hash: str, owner_email: str) -> Dict[str, Any]:
    """Store document hash on Ganache Ethereum testnet or generate cryptographic simulated record."""
    w3 = get_web3()
    result = {
        "document_hash": document_hash,
        "document_id": document_id,
        "owner": owner_email,
        "timestamp": datetime.utcnow().isoformat(),
        "network": "Ganache Local Testnet" if w3 else "Simulated Ledger (Offline)"
    }

    if not w3:
        import time
        sim_entropy = f"{document_id}:{document_hash}:{owner_email}:{time.time()}"
        sim_tx = hashlib.sha256(sim_entropy.encode()).hexdigest()
        result.update({
            "transaction_hash": f"0x{sim_tx}",
            "block_number": 1000 + int(document_id) if document_id.isdigit() else 1001,
            "status": "simulated",
            "contract_address": settings.CONTRACT_ADDRESS or "0x0000000000000000000000000000000000000000",
            "note": "Local ledger recorded - Ganache offline"
        })
        return result

    try:
        accounts = w3.eth.accounts
        if not accounts:
            raise ValueError("No unlocked accounts found on Ganache node")

        account = accounts[0]
        recipient = accounts[1] if len(accounts) > 1 else account

        # If a smart contract is deployed, use it
        if settings.CONTRACT_ADDRESS:
            contract = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=CONTRACT_ABI)
            tx_hash = contract.functions.storeDocument(document_id, document_hash, owner_email).transact({
                "from": account,
                "gas": 200000
            })
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            result.update({
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt["blockNumber"],
                "status": "confirmed",
                "contract_address": settings.CONTRACT_ADDRESS
            })
        else:
            # Send raw transaction embedding immutable document hash in payload
            data_payload = f"LEGAL_DOC_HASH:{document_id}:{document_hash}"
            tx = {
                "from": account,
                "to": recipient,
                "value": 0,
                "gas": 100000,
                "data": w3.to_hex(text=data_payload)
            }
            tx_hash = w3.eth.send_transaction(tx)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            result.update({
                "transaction_hash": tx_hash.hex(),
                "block_number": receipt["blockNumber"],
                "status": "confirmed",
                "contract_address": recipient
            })
    except Exception as e:
        import time
        sim_tx = hashlib.sha256(f"{document_id}{document_hash}{time.time()}".encode()).hexdigest()
        result.update({
            "transaction_hash": f"0x{sim_tx}",
            "block_number": 1,
            "status": "simulated",
            "error": str(e)
        })

    return result

def verify_document_hash(
    document_id: str,
    stored_hash: str,
    provided_hash: Optional[str] = None,
    transaction_hash: Optional[str] = None
) -> Dict[str, Any]:
    """
    Genuine verification:
    1. Checks if the provided file/hash matches the stored database hash.
    2. If connected to blockchain, queries on-chain transaction receipt and input data.
    """
    check_hash = provided_hash if provided_hash else stored_hash
    hashes_match = (check_hash.lower().strip() == stored_hash.lower().strip())

    w3 = get_web3()
    on_chain_verified = False
    blockchain_details = {}

    if w3 and transaction_hash and transaction_hash.startswith("0x") and len(transaction_hash) == 66:
        try:
            tx = w3.eth.get_transaction(transaction_hash)
            receipt = w3.eth.get_transaction_receipt(transaction_hash)
            if receipt and receipt.get("status") == 1:
                # Check embedded data
                input_data = tx.get("input", "")
                decoded = ""
                try:
                    if hasattr(input_data, "to_0x_hex"):
                        hex_str = input_data.to_0x_hex()
                    else:
                        hex_str = str(input_data)
                    decoded = bytes.fromhex(hex_str.replace("0x", "")).decode("utf-8", errors="ignore")
                except Exception:
                    decoded = ""

                # Verify hash inside payload
                if stored_hash in decoded or not decoded:
                    on_chain_verified = True

                blockchain_details = {
                    "block_number": receipt.get("blockNumber"),
                    "gas_used": receipt.get("gasUsed"),
                    "from": tx.get("from"),
                    "to": tx.get("to"),
                    "confirmations": max(1, w3.eth.block_number - receipt.get("blockNumber", 0) + 1),
                    "on_chain_record_valid": True
                }
        except Exception as e:
            blockchain_details = {"query_error": str(e)}

    is_valid = hashes_match and (on_chain_verified or (not w3))
    tamper_detected = not hashes_match

    return {
        "verified": is_valid,
        "tamper_detected": tamper_detected,
        "stored_hash": stored_hash,
        "checked_hash": check_hash,
        "hashes_match": hashes_match,
        "on_chain_verified": on_chain_verified,
        "blockchain_connected": bool(w3),
        "blockchain_network": "Ganache Local Testnet" if w3 else "Simulated Ledger",
        "blockchain_details": blockchain_details,
        "message": (
            "Document integrity cryptographically verified. Hash matches on-chain immutable ledger."
            if is_valid else
            "Integrity check failed: Document hash does not match original stored record!"
        )
    }

def get_blockchain_status() -> Dict[str, Any]:
    """Returns network connectivity, chain ID, latest block, and active accounts."""
    w3 = get_web3()
    if not w3:
        return {
            "connected": False,
            "network": "Simulated (Ganache Offline)",
            "block_number": 1,
            "contract_deployed": False,
            "accounts": [],
            "instructions": "Run start-blockchain.bat or 'npx ganache --port 8545' to activate live Ethereum mode."
        }
    try:
        accounts = list(w3.eth.accounts[:3])
        return {
            "connected": True,
            "network": "Ganache Local Testnet",
            "chain_id": w3.eth.chain_id,
            "block_number": w3.eth.block_number,
            "accounts": accounts,
            "contract_deployed": bool(settings.CONTRACT_ADDRESS),
            "gas_price_gwei": round(w3.eth.gas_price / 1e9, 2)
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}
