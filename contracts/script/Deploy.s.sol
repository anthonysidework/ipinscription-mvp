// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IPInscriptionRegistry} from "../src/IPInscriptionRegistry.sol";

/// @notice Deploys IPInscriptionRegistry to a testnet.
/// @dev Usage:
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url base_sepolia \
///     --private-key $PRIVATE_KEY \
///     --broadcast --verify
///
/// Requires env vars (see .env.example): BASE_SEPOLIA_RPC_URL, PRIVATE_KEY,
/// and ETHERSCAN_API_KEY if using --verify.
contract Deploy is Script {
    function run() external returns (IPInscriptionRegistry registry) {
        vm.startBroadcast();
        registry = new IPInscriptionRegistry();
        vm.stopBroadcast();

        console2.log("IPInscriptionRegistry deployed at:", address(registry));
    }
}
