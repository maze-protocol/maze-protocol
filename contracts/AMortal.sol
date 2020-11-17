pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./ITRC20.sol";

// Abstract contract
contract AMortal {

    // Destroy and return selected assets to owner
    function _die(address payable receiver, ITRC20[] assets) external onlyOwner {
        uint amount;
        for (uint i = 0; i < assets.length - 1; i++) {
            amount = assets[i].balanceOf(address(assets[i]));
            assets[i].approve(receiver, amount);
            assets[i].transferFrom(address(this), receiver, amount);
        }
        selfdestruct(receiver);
    }

    // Abstract method for selfdestruct
    function die(address payable receiver, address[] assets) external onlyOwner;
}
