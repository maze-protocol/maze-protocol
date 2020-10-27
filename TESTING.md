### Testing

1. Use docker image with current Fullnode - https://github.com/maze-protocol/docker-tron-quickstart.
2. Edit config.js and use yours accounts.
3. Copy key file and change (leave key for Tron Quickstart)

   `$ cp privatekey.js.dist privatekey.js`
6. Uncomment dev function `testSendToJustswap` in `contracts/MazePresale.sol` 
7. In `contracts/MazePromoFund.sol` inside `startRelease` function uncomment testing code, and comment production
5. Run tests separately

   `$ yarn test test/MazeToken.test.js`
