// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ItemManager.sol";

contract Item {
    uint256 public priceInWei;
    uint256 public paidWei;
    uint256 public index;
    ItemManager public parentContract;

    // Constructor — visibility removed as per Solidity ^0.7.0+ standards
    constructor(
        ItemManager _parentContract,
        uint256 _priceInWei,
        uint256 _index
    ) {
        priceInWei = _priceInWei;
        index = _index;
        parentContract = _parentContract;
    }

    // This function will be called when payment is sent to this contract
    receive() external payable {
        require(msg.value == priceInWei, "Partial payments not supported");
        require(paidWei == 0, "Item already paid");
        
        paidWei += msg.value;

        // Notify the parent contract that payment has been received
        (bool success, ) = address(parentContract).call{value: msg.value}(
            abi.encodeWithSignature("triggerPayment(uint256)", index)
        );
        require(success, "Payment callback failed");
    }

    // Fallback to prevent accidental ETH transfers or wrong calls
    fallback() external payable {
        revert("Fallback: Invalid call");
    }
}
