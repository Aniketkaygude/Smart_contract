// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Ownable.sol";
import "./Item.sol";

contract ItemManager {
    enum SupplyChainSteps {
        Created,
        Paid,
        Delivered
    }

    struct S_Item {
        Item _item;
        SupplyChainSteps _step;
        string _identifier;
    }

    mapping(uint256 => S_Item) public items;
    uint256 public index;

    event SupplyChainStep(uint256 _itemIndex, uint256 _step, address _itemAddress);

    function createItem(string memory _identifier, uint256 _priceInWei) public {
        Item item = new Item(this, _priceInWei, index);
        items[index]._item = item;
        items[index]._step = SupplyChainSteps.Created;
        items[index]._identifier = _identifier;

        emit SupplyChainStep(index, uint256(items[index]._step), address(item));
        index++;
    }

    function triggerPayment(uint256 _index) public payable {
        Item item = items[_index]._item;

        require(address(item) == msg.sender, "Only items can update themselves");
        require(item.priceInWei() == msg.value, "Incorrect payment amount");
        require(items[_index]._step == SupplyChainSteps.Created, "Item already paid or delivered");

        items[_index]._step = SupplyChainSteps.Paid;
        emit SupplyChainStep(_index, uint256(items[_index]._step), address(item));
    }

    function triggerDelivery(uint256 _index) public {
        require(items[_index]._step == SupplyChainSteps.Paid, "Item not paid yet");

        items[_index]._step = SupplyChainSteps.Delivered;
        emit SupplyChainStep(_index, uint256(items[_index]._step), address(items[_index]._item));
    }
}
