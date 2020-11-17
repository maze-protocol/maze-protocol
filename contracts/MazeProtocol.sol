pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./BasisPoints.sol";
import "./AMazeProtocolProject.sol";
import "./IMazeProtocolProjectFactory.sol";
import "../flat/MazeToken.sol";

contract MazeProtocol is Initializable, Ownable {

    AMazeProtocolProject[] public projects;
    MazeToken public token;

    modifier indexExists(uint index) {
        require(index < projects.length, "Index must exists");
        _;
    }

    function addProject(AMazeProtocolProject project)
    {
        projects.push(project);
    }

    function removeProject(uint index, ITRC20[] assets) onlyOwner indexExists(index)
    {
        AMazeProtocolProject project = projects[index];
        project.die(owner, assets);

        for (uint i = index; i < projects.length - 1; i++) {
            projects[i] = projects[i + 1];
        }

        delete projects[projects.length - 1];
        projects.length--;
    }

    function approveProject(uint index, bool approved) onlyOwner indexExists(index)
    {
        projects[i].approve(approved);
    }

    function setProjectScore(uint index, uint score) onlyOwner indexExists(index)
    {
        projects[i].setScore(score);
    }

    function addProjectCreator(IMazeProtocolProjectFactory factory)
    {
        factory.transferOwnership(address(this));
        factory.setProtocol(this);
    }

    function setMazeToken(MazeToken _token)
    {
        token = _token;
    }
}
