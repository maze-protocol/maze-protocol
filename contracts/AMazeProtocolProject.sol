pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./BasisPoints.sol";
import "./AMortal.sol";
import "../flat/MazePresale.sol";

contract AMazeProtocolProject is AMortal, Ownable, Initializable {
    using BasisPoints for uint;
    using SafeMath for uint;

    bool public approved = false;
    uint public score = 0;

    function approve(bool _approved) external onlyOwner {
        approve = _approved;
    }

    function setScore(uint _score) external onlyOwner {
        score = _score;
    }
}
