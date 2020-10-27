const MazeToken = artifacts.require('MazeToken.sol');
const MazePresaleTimer = artifacts.require('MazePresaleTimer.sol');
const MazePresale = artifacts.require('MazePresale.sol');
const MazeTeamFund = artifacts.require('MazeTeamFund.sol');
const MazeStakingFund = artifacts.require('MazeStakingFund.sol');
const MazePromoFund = artifacts.require('MazePromoFund.sol');

const config = require('../config');
const keys = require('../privatekey');

const deploy = async (deployer, network) => {

    await deployer.deploy(MazePresale);
    const token = await MazeToken.deployed();
    const timer = await MazePresaleTimer.deployed();
    const presale = await MazePresale.deployed();

    const teamFund = await MazeTeamFund.deployed();
    const stakingFund = await MazeStakingFund.deployed();
    const promoFund = await MazePromoFund.deployed();

    await token.addMinter(presale.address)
    await token.addTrustedContract(presale.address)
    await presale.init(
        config.MazePresale.maxBuyPerAddress,
        config.MazePresale.minBuyPerAddress,
        config.MazePresale.redeemBP,
        config.MazePresale.redeemInterval,
        config.MazePresale.referralBP,
        config.MazePresale.price,
        config.MazePresale.trxPools.justswapFound,
        config.MazePresale.tokenPools.justswapFound,
        config.MazePresale.tokenPools.presale,
        keys[network].publickey,
        timer.address,
        token.address
    )
    await presale.setTrxPools(
        [
            promoFund.address,
            teamFund.address
        ],
        [
            config.MazePresale.trxPools.promoFund,
            config.MazePresale.trxPools.teamFund
        ]
    );
    await presale.setTokenPools(
        [
            promoFund.address,
            stakingFund.address,
            teamFund.address
        ],
        [
            config.MazePresale.tokenPools.promoFund,
            config.MazePresale.tokenPools.stakingFund,
            config.MazePresale.tokenPools.teamFund
        ]
    );
}

module.exports = function (depolyer, network) {
    deploy(depolyer, network);
}
