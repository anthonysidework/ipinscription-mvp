// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IPInscriptionRegistry} from "../src/IPInscriptionRegistry.sol";

contract IPInscriptionRegistryTest is Test {
    IPInscriptionRegistry internal registry;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    bytes32 internal constant HASH_A = keccak256("file-a");
    bytes32 internal constant HASH_B = keccak256("file-b");

    string internal constant CID_A = "bafyFileA";
    string internal constant META_A = "ipfs://bafyMetaA";

    // Mirror of the contract event for expectEmit.
    event Inscribed(
        uint256 indexed id,
        bytes32 indexed contentHash,
        address indexed owner,
        string cid,
        uint256 timestamp
    );

    function setUp() public {
        registry = new IPInscriptionRegistry();
    }

    /* ------------------------------------------------------------------ */
    /*                          inscribe: happy path                       */
    /* ------------------------------------------------------------------ */

    function test_Inscribe_HappyPath() public {
        vm.warp(1_700_000_000); // deterministic timestamp
        vm.prank(alice);

        vm.expectEmit(true, true, true, true);
        emit Inscribed(0, HASH_A, alice, CID_A, block.timestamp);

        uint256 id = registry.inscribe(HASH_A, CID_A, META_A);

        assertEq(id, 0, "first id should be 0");
        assertEq(registry.total(), 1, "total should be 1");

        IPInscriptionRegistry.Inscription memory rec = registry.getInscription(id);
        assertEq(rec.contentHash, HASH_A);
        assertEq(rec.cid, CID_A);
        assertEq(rec.metadataURI, META_A);
        assertEq(rec.owner, alice);
        assertEq(rec.timestamp, 1_700_000_000);
    }

    function test_Inscribe_AssignsSequentialIds() public {
        vm.prank(alice);
        uint256 id0 = registry.inscribe(HASH_A, CID_A, META_A);
        vm.prank(bob);
        uint256 id1 = registry.inscribe(HASH_B, "cidB", "ipfs://metaB");

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(registry.total(), 2);
    }

    /* ------------------------------------------------------------------ */
    /*                         inscribe: revert paths                      */
    /* ------------------------------------------------------------------ */

    function test_Inscribe_RevertOnDuplicateHash() public {
        vm.prank(alice);
        registry.inscribe(HASH_A, CID_A, META_A);

        // Even a different sender / cid cannot re-inscribe the same hash.
        vm.prank(bob);
        vm.expectRevert(bytes("already inscribed"));
        registry.inscribe(HASH_A, "otherCid", "ipfs://otherMeta");
    }

    function test_Inscribe_RevertOnZeroHash() public {
        vm.prank(alice);
        vm.expectRevert(bytes("invalid hash"));
        registry.inscribe(bytes32(0), CID_A, META_A);
    }

    /* ------------------------------------------------------------------ */
    /*                            verify: hit/miss                         */
    /* ------------------------------------------------------------------ */

    function test_Verify_Hit() public {
        vm.warp(1_700_000_123);
        vm.prank(alice);
        registry.inscribe(HASH_A, CID_A, META_A);

        (bool exists, IPInscriptionRegistry.Inscription memory rec) = registry.verify(HASH_A);
        assertTrue(exists, "should exist");
        assertEq(rec.owner, alice);
        assertEq(rec.cid, CID_A);
        assertEq(rec.timestamp, 1_700_000_123);
    }

    function test_Verify_Miss() public view {
        (bool exists, IPInscriptionRegistry.Inscription memory rec) = registry.verify(HASH_B);
        assertFalse(exists, "should not exist");
        // Record should be zero-valued on a miss.
        assertEq(rec.contentHash, bytes32(0));
        assertEq(rec.owner, address(0));
        assertEq(rec.timestamp, 0);
        assertEq(bytes(rec.cid).length, 0);
    }

    /* ------------------------------------------------------------------ */
    /*                            owner indexing                           */
    /* ------------------------------------------------------------------ */

    function test_GetByOwner_TracksMultiplePerOwner() public {
        vm.startPrank(alice);
        registry.inscribe(HASH_A, CID_A, META_A);
        registry.inscribe(HASH_B, "cidB", "ipfs://metaB");
        vm.stopPrank();

        vm.prank(bob);
        registry.inscribe(keccak256("file-c"), "cidC", "ipfs://metaC");

        uint256[] memory aliceIds = registry.getByOwner(alice);
        uint256[] memory bobIds = registry.getByOwner(bob);

        assertEq(aliceIds.length, 2);
        assertEq(aliceIds[0], 0);
        assertEq(aliceIds[1], 1);

        assertEq(bobIds.length, 1);
        assertEq(bobIds[0], 2);
    }

    function test_GetByOwner_EmptyForUnknown() public view {
        uint256[] memory ids = registry.getByOwner(address(0xDEAD));
        assertEq(ids.length, 0);
    }

    /* ------------------------------------------------------------------ */
    /*                       getInscription bounds                         */
    /* ------------------------------------------------------------------ */

    function test_GetInscription_RevertOutOfRange() public {
        vm.expectRevert(bytes("out of range"));
        registry.getInscription(0); // nothing inscribed yet
    }

    /* ------------------------------------------------------------------ */
    /*                              fuzz                                    */
    /* ------------------------------------------------------------------ */

    function testFuzz_InscribeThenVerify(bytes32 h, address who) public {
        vm.assume(h != bytes32(0));
        vm.assume(who != address(0));

        vm.prank(who);
        uint256 id = registry.inscribe(h, "cid", "ipfs://meta");

        (bool exists, IPInscriptionRegistry.Inscription memory rec) = registry.verify(h);
        assertTrue(exists);
        assertEq(rec.owner, who);
        assertEq(id, 0);

        uint256[] memory ids = registry.getByOwner(who);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }
}
