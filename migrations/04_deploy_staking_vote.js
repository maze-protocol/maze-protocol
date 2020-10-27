const MazeStakingVote= artifacts.require('MazeStakingVote.sol');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {
    await deployer.deploy(MazeStakingVote);
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
