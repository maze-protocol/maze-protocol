const toMaze = num => tronWeb.toSun(num * 1000000000000);

const reExprectRevert = /REVERT|CONTRACT_VALIDATE_ERROR/;
const expectRevert = async promise => {
    try {
        const result = await promise;
        return result;
    } catch (err) {
        return reExprectRevert.test(err) ? true : err;
    }
}

const BN = bn => tronWeb.BigNumber.isBigNumber(bn) ? bn : new tronWeb.BigNumber(bn);

module.exports = {
    toMaze,
    expectRevert,
    BN
}
