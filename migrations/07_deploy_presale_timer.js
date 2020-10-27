const MazePresaleTimer = artifacts.require('MazePresaleTimer.sol');
const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazePresaleTimer);
    const timer  = await MazePresaleTimer.deployed();
    timer.init(
        config.MazePresaleTimer.startTime,
        config.MazePresaleTimer.baseTimer,
        config.MazePresaleTimer.deltaTimer,
        keys[network].publickey
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
