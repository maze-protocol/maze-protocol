const MazeToken = artifacts.require('MazeToken.sol');
const MazeTeamFund = artifacts.require('MazeTeamFund.sol');
const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazeTeamFund);
    const token = await MazeToken.deployed();
    const fund  = await MazeTeamFund.deployed();
    fund.init(
        config.MazeTeamFund.releaseInterval,
        config.MazeTeamFund.releaseBP,
        config.MazeTeamFund.addresses,
        config.MazeTeamFund.basisPoints,
        token.address
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
