pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./MazePresaleTimer.sol";
import "./MazePresale.sol";
import "./MazeStakingFund.sol";

contract MazeStakingVote  is Initializable
{
    using SafeMath for uint;

    uint constant public BURN = 1;
    uint constant public STAKE_MAZE = 2;
    uint constant public STAKE_MAZE_TRX = 3;
    uint constant public STAKE_MAZE_MULTI = 4;

    uint public burnCount;
    uint public stakeMazeCount;
    uint public stakeMazeTrxCount;
    uint public stakeMazeMultiCount;

    bool public burned = false;

    uint public minimalTrxDeposit;
    MazePresaleTimer timer;
    MazePresale presale;
    MazeStakingFund stakingFound;

    mapping(address => uint) public voters;
    uint public votersCount;

    function init(
        uint _minimalTrxDeposit,
        MazePresaleTimer _timer,
        MazePresale _presale,
        MazeStakingFund _stakingFound
    ) external initializer {

        minimalTrxDeposit = _minimalTrxDeposit;
        timer = _timer;
        presale = _presale;
        stakingFound = _stakingFound;

    }

    modifier whenPresaleActive {
        require(timer.isStarted(), "Presale not yet started.");
        require(!presale.isPresaleEnded(), "Presale has ended.");
        _;
    }

    modifier whenPresaleFinished {
        require(timer.isStarted(), "Presale not yet started.");
        require(presale.isPresaleEnded(), "Presale has not yet ended.");
        _;
    }

    function burn() external whenPresaleFinished {
        require(burnCount > stakeMazeCount, "BURN is not maximum");
        require(burnCount > stakeMazeMultiCount, "BURN is not maximum");
        require(burnCount > stakeMazeTrxCount, "BURN is not maximum");
        require(!burned, "Already burned");

        burned = true;
        stakingFound.burn();
    }

    function isVoter(address voter) public view returns (bool) {
        return voters[voter] > 0;
    }

    function vote(uint option) external whenPresaleActive {

        require(presale.getDepositInTrx(msg.sender) >= minimalTrxDeposit, "Your deposit is too low");
        require(1 <= option && option <= 4, "Option not allowed");

        require(option != voters[msg.sender], "Voted on this option");

        // Increment voters
        if (voters[msg.sender] == 0) {
            votersCount = votersCount.add(1);
        }
        // Remove old vote
        else if (voters[msg.sender] == BURN) {
            burnCount = burnCount.sub(1);
        }
        else if (voters[msg.sender] == STAKE_MAZE) {
            stakeMazeCount = stakeMazeCount.sub(1);
        }
        else if (voters[msg.sender] == STAKE_MAZE_TRX) {
            stakeMazeTrxCount = stakeMazeTrxCount.sub(1);
        }
        else if (voters[msg.sender] == STAKE_MAZE_MULTI) {
            stakeMazeMultiCount = stakeMazeMultiCount.sub(1);
        }

        voters[msg.sender] = option;

        // Add new vote
        if (option == BURN) {
            burnCount = burnCount.add(1);
        }
        else if (option == STAKE_MAZE) {
            stakeMazeCount = stakeMazeCount.add(1);
        }
        else if (option == STAKE_MAZE_TRX) {
            stakeMazeTrxCount = stakeMazeTrxCount.add(1);
        }
        else if (option == STAKE_MAZE_MULTI) {
            stakeMazeMultiCount = stakeMazeMultiCount.add(1);
        }
    }

}
