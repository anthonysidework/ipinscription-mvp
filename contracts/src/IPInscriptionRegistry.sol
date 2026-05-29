// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IPInscriptionRegistry
/// @notice A minimal, append-only registry that timestamps proofs of authorship for
///         arbitrary off-chain content. A creator inscribes the keccak256 hash of their
///         file together with the IPFS CID of the file and a CID/URI of a small metadata
///         JSON. Anyone can later verify that a given file (by its hash) was inscribed,
///         by whom, and when.
///
/// @dev    DESIGN NOTES
///         - The contract stores only a content hash + pointers (CIDs/URIs). The actual
///           bytes live on IPFS; the chain provides the tamper-proof timestamp + ownership.
///         - Each content hash can be inscribed exactly once (first-writer-wins). This is
///           what makes an inscription a meaningful proof of priority.
///         - `hashToId` stores `id + 1` so that the zero value cleanly means "not found".
///
/// @custom:warning TESTNET ONLY. This contract is UNAUDITED and is NOT intended for
///         production or mainnet use. It handles no funds and makes no legal claims about
///         IP ownership — it only records that an address submitted a hash at a block time.
contract IPInscriptionRegistry {
    /// @notice A single proof-of-authorship record.
    /// @param contentHash keccak256 over the raw file bytes (computed client-side).
    /// @param cid         IPFS CID of the original file.
    /// @param metadataURI IPFS URI/CID of the metadata JSON (title, description, type, contentHash).
    /// @param owner       Address that submitted the inscription.
    /// @param timestamp   Block timestamp at which the inscription was recorded.
    struct Inscription {
        bytes32 contentHash;
        string cid;
        string metadataURI;
        address owner;
        uint256 timestamp;
    }

    /// @dev All inscriptions, indexed by id (their position in this array).
    Inscription[] private inscriptions;

    /// @dev contentHash => id + 1. A value of 0 means the hash has not been inscribed.
    mapping(bytes32 => uint256) private hashToId;

    /// @dev owner => list of inscription ids they own.
    mapping(address => uint256[]) private ownerToIds;

    /// @notice Emitted once per successful inscription.
    /// @param id          The new inscription's id.
    /// @param contentHash The inscribed content hash (indexed for hash lookups via logs).
    /// @param owner       The creator's address (indexed for owner lookups via logs).
    /// @param cid         IPFS CID of the file.
    /// @param timestamp   Block timestamp recorded for the inscription.
    event Inscribed(
        uint256 indexed id,
        bytes32 indexed contentHash,
        address indexed owner,
        string cid,
        uint256 timestamp
    );

    /// @notice Inscribe a new proof of authorship.
    /// @dev Reverts if `contentHash` has already been inscribed (first-writer-wins).
    /// @param contentHash keccak256 of the file bytes. Must be non-zero.
    /// @param cid         IPFS CID of the file.
    /// @param metadataURI IPFS URI/CID of the metadata JSON.
    /// @return id The id assigned to the new inscription.
    function inscribe(
        bytes32 contentHash,
        string calldata cid,
        string calldata metadataURI
    ) external returns (uint256 id) {
        require(contentHash != bytes32(0), "invalid hash");
        require(hashToId[contentHash] == 0, "already inscribed");

        id = inscriptions.length;
        inscriptions.push(
            Inscription({
                contentHash: contentHash,
                cid: cid,
                metadataURI: metadataURI,
                owner: msg.sender,
                timestamp: block.timestamp
            })
        );

        // Store id + 1 so that 0 unambiguously means "not present".
        hashToId[contentHash] = id + 1;
        ownerToIds[msg.sender].push(id);

        emit Inscribed(id, contentHash, msg.sender, cid, block.timestamp);
    }

    /// @notice Check whether a content hash has been inscribed and return its record.
    /// @param contentHash The hash to look up.
    /// @return exists True if the hash is present in the registry.
    /// @return record The inscription record (zero-valued if `exists` is false).
    function verify(bytes32 contentHash)
        external
        view
        returns (bool exists, Inscription memory record)
    {
        uint256 stored = hashToId[contentHash];
        if (stored == 0) {
            return (false, record); // record stays zero-valued
        }
        return (true, inscriptions[stored - 1]);
    }

    /// @notice Fetch a single inscription by id.
    /// @param id The inscription id.
    /// @return The inscription record.
    function getInscription(uint256 id) external view returns (Inscription memory) {
        require(id < inscriptions.length, "out of range");
        return inscriptions[id];
    }

    /// @notice List the inscription ids owned by an address.
    /// @param owner The owner address.
    /// @return An array of inscription ids (may be empty).
    function getByOwner(address owner) external view returns (uint256[] memory) {
        return ownerToIds[owner];
    }

    /// @notice Total number of inscriptions in the registry.
    /// @return The count.
    function total() external view returns (uint256) {
        return inscriptions.length;
    }
}
