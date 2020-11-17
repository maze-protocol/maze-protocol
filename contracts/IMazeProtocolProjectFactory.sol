pragma solidity ^0.5.0;

import "./MazeProtocol.sol";

interface IMazeProtocolProjectFactory {
    function transferOwnership(address newOwner) public onlyOwner;
    function setProtocol(MazeProtocol protocol) external;
}
