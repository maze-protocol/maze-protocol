const MazePresaleTimer = artifacts.require('MazePresaleTimer.sol');
const MazePresale = artifacts.require('MazePresale.sol');
const MazeStakingFund = artifacts.require('MazeStakingFund.sol');
const MazeStakingVote= artifacts.require('MazeStakingVote.sol');

const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {

    const timer = await MazePresaleTimer.deployed();
    const presale = await MazePresale.deployed();
    const vote = await MazeStakingVote.deployed();
    const stakingFund = await MazeStakingFund.deployed();

    await vote.init(
        config.MazeStakingVote.minimalTrxDeposit,
        timer.address,
        presale.address,
        stakingFund.address
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
