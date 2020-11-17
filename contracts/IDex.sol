pragma solidity ^0.5.0;

// User for
// - liquidity pools
// - tokens exchange for multi-currency accepted sales
// - price
interface IDex {
    function addLiquidity(address tokenAddress, uint trx, uint tokenAmount) external;
    function exchange(address fromAddress, uint fromAmount, address toAddress, address recipient) external;
    function price(address fromAddress, uint fromAmount, address toAddress) external view returns(uint);
}
