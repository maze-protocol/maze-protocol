pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./MazeStakingVote.sol";
import "./MazeToken.sol";


contract MazeStakingFund is Initializable {
    using SafeMath for uint;

    MazeToken private mazeToken;
    MazeStakingVote private vote;
    address public authorizer;
    address public releaser;

    address public authorizedContract;
    uint public authorizedContractVotes;

    uint public totalMazeAuthorized;
    uint public totalMazeReleased;

    function init(
        address _authorizer,
        address _releaser,
        MazeToken _mazeToken,
        MazeStakingVote _vote
    ) external initializer {
        mazeToken = _mazeToken;
        authorizer = _authorizer;
        releaser = _releaser;
        vote = _vote;
    }

    function() external payable { }

    function releaseMazeToAddress(address receiver, uint amount) external returns(uint) {
        require(msg.sender == releaser, "Can only be called releaser.");
        require(amount <= totalMazeAuthorized.sub(totalMazeReleased), "Cannot release more Maze than available.");
        totalMazeReleased = totalMazeReleased.add(amount);
        mazeToken.transfer(receiver, amount);
    }

    function authorizeMaze(uint amount) external returns (uint) {
        require(msg.sender == authorizer, "Can only be called authorizer.");
        totalMazeAuthorized = totalMazeAuthorized.add(amount);
    }

    function burn() external {
        require(msg.sender == address(vote), "Only MazeStakingVote can burn tokens");
        mazeToken.burn(mazeToken.balanceOf(address(this)));
    }

    function authorizeContract(address _contract) external {
        require(msg.sender == authorizer, "Can only be called authorizer.");
        authorizedContract = _contract;
    }

    function approveContract(address _contract) external {
        require(msg.sender == releaser, "Can only be called releaser.");
        require(authorizedContract == _contract, "Must be authorizedContract");
        authorizer = _contract;
        releaser = _contract;
    }
}
