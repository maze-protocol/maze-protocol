pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./IMazeCertifiableToken.sol";


contract MazePromoFund is Initializable {

    using SafeMath for uint;

    IMazeCertifiableToken private mazeToken;

    address public authorizer;
    address public releaser;

    uint public totalMazeAuthorized;
    uint public totalMazeReleased;

    uint public totalTrxAuthorized;
    uint public totalTrxReleased;

    mapping(address => bool) authorizers;

    mapping(address => bool) releasers;

    function init(
        address _authorizer,
        address _releaser,
        IMazeCertifiableToken _mazeToken
    ) external initializer {
        mazeToken = _mazeToken;
        authorizer = _authorizer;
        releaser = _releaser;
    }

    function() external payable { }

    function releaseMazeToAddress(address receiver, uint amount) external returns(uint) {
        require(msg.sender == releaser || releasers[msg.sender], "Can only be called releaser.");
        require(amount <= totalMazeAuthorized.sub(totalMazeReleased), "Cannot release more Maze than available.");
        totalMazeReleased = totalMazeReleased.add(amount);
        mazeToken.transfer(receiver, amount);
    }

    function authorizeMaze(uint amount) external returns (uint) {
        require(msg.sender == authorizer || authorizers[msg.sender], "Can only be called authorizer.");
        totalMazeAuthorized = totalMazeAuthorized.add(amount);
    }

    function releaseTrxToAddress(address payable receiver, uint amount) external returns(uint) {
        require(msg.sender == releaser || releasers[msg.sender], "Can only be called releaser.");
        require(amount <= totalTrxAuthorized.sub(totalTrxReleased), "Cannot release more Trx than available.");
        totalTrxReleased = totalTrxReleased.add(amount);
        receiver.transfer(amount);
    }

    function authorizeTrx(uint amount) external returns (uint) {
        require(msg.sender == authorizer || authorizers[msg.sender], "Can only be called authorizer.");
        totalTrxAuthorized = totalTrxAuthorized.add(amount);
    }

    function setAuthorizorStatus(address _authorizer, bool _isAuthorized) external {
        require(msg.sender == authorizer || authorizers[msg.sender], "Can only be called authorizer.");
        authorizers[_authorizer] = _isAuthorized;
    }

    function setReleaserStatus(address _releaser, bool _isAuthorized) external {
        require(msg.sender == releaser || releasers[msg.sender], "Can only be called authorizer.");
        releasers[_releaser] = _isAuthorized;
    }
}
