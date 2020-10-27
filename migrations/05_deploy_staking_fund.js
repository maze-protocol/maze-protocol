const MazeToken = artifacts.require('MazeToken.sol');
const MazeStakingFund = artifacts.require('MazeStakingFund.sol');
const MazeStakingVote= artifacts.require('MazeStakingVote.sol');
const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazeStakingFund);
    const token = await MazeToken.deployed();
    const vote = await MazeStakingVote.deployed();
    const fund  = await MazeStakingFund.deployed();
    fund.init(
        config.MazeStakingFund.authorizer,
        config.MazeStakingFund.releaser,
        token.address,
        vote.address
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
