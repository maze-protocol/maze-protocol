const MazeToken = artifacts.require('MazeToken.sol');
const MazePromoFund = artifacts.require('MazePromoFund.sol');
const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazePromoFund);
    const token = await MazeToken.deployed();
    const fund  = await MazePromoFund.deployed();
    fund.init(
        config.MazePromoFund.authorizer,
        config.MazePromoFund.releaser,
        token.address
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
