// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DocumentVerification
 * @dev Stores and verifies SHA-256 hashes of legal documents on-chain.
 *      Provides tamper-proof proof-of-existence for uploaded contracts.
 * @author Intelligent Legal Document Analysis System
 */
contract DocumentVerification {

    struct DocumentRecord {
        string  documentHash;       // SHA-256 hash of the document
        string  owner;              // Owner identifier (email / user ID)
        uint256 timestamp;          // Unix timestamp when stored
        bool    exists;             // Whether record exists on chain
        uint256 verificationCount;  // Number of times verified
    }

    // Mapping: documentId (string) → DocumentRecord
    mapping(string => DocumentRecord) private _documents;

    // Ordered list of all document IDs
    string[] private _documentIds;

    // Contract deployer
    address public contractOwner;

    // ──────────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────────

    event DocumentStored(
        string  indexed documentId,
        string          documentHash,
        string          owner,
        uint256         timestamp
    );

    event DocumentVerified(
        string  indexed documentId,
        bool            isMatch,
        string          verifiedHash,
        uint256         timestamp
    );

    // ──────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Not contract owner");
        _;
    }

    modifier documentExists(string memory documentId) {
        require(_documents[documentId].exists, "Document not found on blockchain");
        _;
    }

    modifier documentNotExists(string memory documentId) {
        require(!_documents[documentId].exists, "Document already registered");
        _;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────────────────────────────────

    constructor() {
        contractOwner = msg.sender;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Write Functions
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Store a new document hash on the blockchain.
     * @param documentId  Unique identifier (e.g. DB primary key as string)
     * @param documentHash SHA-256 hex hash of the original document bytes
     * @param owner        Owner's email or user identifier
     */
    function storeDocument(
        string memory documentId,
        string memory documentHash,
        string memory owner
    )
        public
        documentNotExists(documentId)
    {
        require(bytes(documentId).length   > 0, "Document ID cannot be empty");
        require(bytes(documentHash).length > 0, "Hash cannot be empty");
        require(bytes(owner).length        > 0, "Owner cannot be empty");

        _documents[documentId] = DocumentRecord({
            documentHash:      documentHash,
            owner:             owner,
            timestamp:         block.timestamp,
            exists:            true,
            verificationCount: 0
        });

        _documentIds.push(documentId);

        emit DocumentStored(documentId, documentHash, owner, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Read Functions
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @dev Retrieve the full record for a stored document.
     */
    function getDocument(string memory documentId)
        public
        view
        returns (
            string memory documentHash,
            string memory owner,
            uint256       timestamp,
            bool          exists
        )
    {
        DocumentRecord storage r = _documents[documentId];
        return (r.documentHash, r.owner, r.timestamp, r.exists);
    }

    /**
     * @dev Check whether a document ID has been registered on-chain.
     */
    function verifyDocument(string memory documentId)
        public
        view
        returns (bool)
    {
        return _documents[documentId].exists;
    }

    /**
     * @dev Compare a supplied hash against the stored hash for a document.
     *      Returns true when the hashes match (document is unchanged).
     */
    function checkIntegrity(
        string memory documentId,
        string memory hashToCheck
    )
        public
        view
        documentExists(documentId)
        returns (bool isMatch)
    {
        isMatch = keccak256(bytes(_documents[documentId].documentHash))
                  == keccak256(bytes(hashToCheck));
    }

    /**
     * @dev Return the total number of documents stored on-chain.
     */
    function getTotalDocuments() public view returns (uint256) {
        return _documentIds.length;
    }

    /**
     * @dev Return a paginated slice of document IDs.
     * @param start  Zero-based start index
     * @param limit  Maximum number of IDs to return
     */
    function getDocumentIds(uint256 start, uint256 limit)
        public
        view
        returns (string[] memory result)
    {
        uint256 total = _documentIds.length;
        if (start >= total) return new string[](0);

        uint256 end = start + limit;
        if (end > total) end = total;

        result = new string[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = _documentIds[i];
        }
    }
}
