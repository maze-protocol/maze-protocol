pragma solidity ^0.5.0;
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./IMazeCertifiableToken.sol";


contract MazeToken is
Initializable,
IMazeCertifiableToken,
ERC20Burnable,
ERC20Mintable,
ERC20Pausable,
ERC20Detailed,
Ownable {
    using SafeMath for uint;

    bool public isTransfersActive;

    mapping(address => bool) private trustedContracts;

    string private _name;

    modifier onlyTrustedContract() {
        require(trustedContracts[msg.sender], "Can only be called by trusted contract");
        _;
    }

    function init(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        address owner
    ) external initializer {

        Ownable.initialize(msg.sender);

        ERC20Detailed.initialize(name, symbol, decimals);

        ERC20Mintable.initialize(address(this));
        _removeMinter(address(this));
        _addMinter(owner);

        ERC20Pausable.initialize(address(this));
        _removePauser(address(this));
        _addPauser(owner);

        //Due to issue in oz testing suite, the msg.sender might not be owner
        _transferOwnership(owner);
    }

    function addTrustedContract(address contractAddress) public onlyOwner {
        trustedContracts[contractAddress] = true;
    }

    function removeTrustedContract(address contractAddress) external onlyOwner {
        trustedContracts[contractAddress] = false;
    }

    function activateTransfers() external onlyTrustedContract {
        isTransfersActive = true;
    }

    function setIsTransfersActive(bool status) external onlyOwner {
        isTransfersActive = status;
    }

    function updateName(string calldata value) external onlyOwner {
        _name = value;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function transfer(address recipient, uint amount) public returns (bool) {
        require(isTransfersActive, "Transfers are currently locked.");
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint amount) public returns (bool) {
        require(isTransfersActive, "Transfers are currently locked.");
        _transfer(sender, recipient, amount);
        if (trustedContracts[msg.sender]) return true;
        approve
        (
            msg.sender,
            allowance(
                sender,
                msg.sender
            ).sub(amount, "Transfer amount exceeds allowance")
        );
        return true;
    }

    function getSender() public view returns (address) {
        return msg.sender;
    }



}
