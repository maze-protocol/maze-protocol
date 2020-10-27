pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";


contract MazePresaleTimer is Initializable, Ownable {
    using SafeMath for uint;

    uint public startTime;
    uint public baseTimer;
    uint public deltaTimer;

    function init(
        uint _startTime,
        uint _baseTimer,
        uint _deltaTimer,
        address owner
    ) external initializer {
        Ownable.initialize(msg.sender);
        startTime = _startTime;
        baseTimer = _baseTimer;
        deltaTimer = _deltaTimer;
        //Due to issue in oz testing suite, the msg.sender might not be owner
        _transferOwnership(owner);
    }

    function setStartTime(uint time) external onlyOwner {
        startTime = time;
    }

    function isStarted() external view returns (bool) {
        return (startTime != 0 && now > startTime);
    }

    function getEndTime(uint bal) external view returns (uint) {
        uint multiplier = bal.div(4000000 trx);
        return startTime.add(baseTimer).add(deltaTimer.mul(multiplier));
    }
}
