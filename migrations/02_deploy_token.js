const MazeToken = artifacts.require('MazeToken.sol');
const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazeToken);
    const token = await MazeToken.deployed();
    await token.init(
            config.MazeToken.name,
            config.MazeToken.symbol,
            config.MazeToken.decimals,
            keys[network].publickey
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
