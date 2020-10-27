pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./BasisPoints.sol";
import "./IMazeCertifiableToken.sol";


contract MazeTeamFund is Initializable {
    using BasisPoints for uint;
    using SafeMath for uint;

    uint public releaseInterval;
    uint public releaseStart;
    uint public releaseBP;

    uint public startingMaze;
    uint public startingTrx;

    address payable[] public teamMemberAddresses;
    uint[] public teamMemberBPs;
    mapping(address => uint) public teamMemberClaimedTrx;
    mapping(address => uint) public teamMemberClaimedMaze;

    IMazeCertifiableToken private mazeToken;

    modifier onlyAfterStart {
        require(releaseStart != 0 && now > releaseStart, "Has not yet started.");
        _;
    }

    function() external payable { }

    function init(
        uint _releaseInterval,
        uint _releaseBP,
        address payable[] calldata _teamMemberAddresses,
        uint[] calldata _teamMemberBPs,
        IMazeCertifiableToken _mazeToken
    ) external initializer {
        require(_teamMemberAddresses.length == _teamMemberBPs.length, "Must have one BP for every address.");

        releaseInterval = _releaseInterval;
        releaseBP = _releaseBP;
        mazeToken = _mazeToken;

        for (uint i = 0; i < _teamMemberAddresses.length; i++) {
            teamMemberAddresses.push(_teamMemberAddresses[i]);
        }

        uint totalTeamBP = 0;
        for (uint i = 0; i < _teamMemberBPs.length; i++) {
            teamMemberBPs.push(_teamMemberBPs[i]);
            totalTeamBP = totalTeamBP.add(_teamMemberBPs[i]);
        }
        require(totalTeamBP == 10000, "Must allocate exactly 100% (10000 BP) to team.");
    }

    function claimMaze(uint id) external onlyAfterStart {
        require(checkIfTeamMember(msg.sender), "Can only be called by team members.");
        require(msg.sender == teamMemberAddresses[id], "Sender must be team member ID");
        uint bp = teamMemberBPs[id];
        uint cycle = getCurrentCycleCount();
        uint totalClaimAmount = cycle.mul(startingMaze.mulBP(bp).mulBP(releaseBP));
        uint toClaim = totalClaimAmount.sub(teamMemberClaimedMaze[msg.sender]);
        if (mazeToken.balanceOf(address(this)) < toClaim) toClaim = mazeToken.balanceOf(address(this));
        teamMemberClaimedMaze[msg.sender] = teamMemberClaimedMaze[msg.sender].add(toClaim);
        mazeToken.transfer(msg.sender, toClaim);
    }

    function claimTrx(uint id) external {
        require(checkIfTeamMember(msg.sender), "Can only be called by team members.");
        require(msg.sender == teamMemberAddresses[id], "Sender must be team member ID");
        uint bp = teamMemberBPs[id];
        uint totalClaimAmount = startingTrx.mulBP(bp);
        uint toClaim = totalClaimAmount.sub(teamMemberClaimedTrx[msg.sender]);
        if (address(this).balance < toClaim) toClaim = address(this).balance;
        teamMemberClaimedTrx[msg.sender] = teamMemberClaimedTrx[msg.sender].add(toClaim);
        msg.sender.transfer(toClaim);
    }

    function startRelease() external {
        require(releaseStart == 0, "Has already started.");
        require(address(this).balance != 0, "Must have some TRX deposited.");
        require(mazeToken.balanceOf(address(this)) != 0, "Must have some maze deposited.");
        startingMaze = mazeToken.balanceOf(address(this));
        startingTrx = address(this).balance;

        //For testing
        // releaseStart = now.sub(24 hours);

        //Production:
        releaseStart = now.add(100 days);
    }

    function resetTeam(
        address payable[] calldata _teamMemberAddresses,
        uint[] calldata _teamMemberBPs
    ) external {
        require(msg.sender == teamMemberAddresses[0], "Must be project lead.");
        delete teamMemberAddresses;
        delete teamMemberBPs;
        for (uint i = 0; i < _teamMemberAddresses.length; i++) {
            teamMemberAddresses.push(_teamMemberAddresses[i]);
        }

        uint totalTeamBP = 0;
        for (uint i = 0; i < _teamMemberBPs.length; i++) {
            teamMemberBPs.push(_teamMemberBPs[i]);
            totalTeamBP = totalTeamBP.add(_teamMemberBPs[i]);
        }
    }

    function getCurrentCycleCount() public view returns (uint) {
        if (now <= releaseStart) return 0;
        return now.sub(releaseStart).div(releaseInterval).add(1);
    }

    function checkIfTeamMember(address member) internal view returns (bool) {
        for (uint i; i < teamMemberAddresses.length; i++) {
            if (teamMemberAddresses[i] == member)
                return true;
        }
        return false;
    }

}
