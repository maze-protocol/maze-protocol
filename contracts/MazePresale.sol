pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "./BasisPoints.sol";
import "./MazePresaleTimer.sol";
import "./IMazeCertifiableToken.sol";
import "./justswap/IJustswapExchange.sol";
import "./justswap/IJustswapFactory.sol";


contract MazePresale is Initializable, Ownable, ReentrancyGuard {
    using BasisPoints for uint;
    using SafeMath for uint;

    uint public maxBuyPerAddress;
    uint public minBuyPerAddress;

    uint public redeemBP;
    uint public redeemInterval;

    uint public referralBP;

    uint public justswapTrxBP;
    address payable[] public trxPools;
    uint[] public trxPoolBPs;

    uint public justswapTokenBP;
    uint public presaleTokenBP;
    address[] public tokenPools;
    uint[] public tokenPoolBPs;

    uint public price;

    bool public hasSentToJustswap;
    bool public hasIssuedTokens;
    bool public hasSentTrx;

    uint public totalTokens;
    uint private totalTrx;
    uint public finalEndTime;

    IMazeCertifiableToken private token;
    IJustswapExchange public justswapExchange;
    MazePresaleTimer private timer;

    mapping(address => uint) public depositAccounts;
    mapping(address => uint) public accountEarnedMaze;
    mapping(address => uint) public accountClaimedMaze;
    mapping(address => bool) public whitelist;
    mapping(address => uint) public earnedReferrals;

    uint public totalDepositors;
    mapping(address => uint) public referralCounts;

    uint mazeRepaired;
    bool pauseDeposit;

    mapping(address => bool) public isRepaired;

    modifier whenPresaleActive {
        require(timer.isStarted(), "Presale not yet started.");
        require(!isPresaleEnded(), "Presale has ended.");
        _;
    }

    modifier whenPresaleFinished {
        require(timer.isStarted(), "Presale not yet started.");
        require(isPresaleEnded(), "Presale has not yet ended.");
        _;
    }

    function init(
        uint _maxBuyPerAddress,
        uint _minBuyPerAddress,
        uint _redeemBP,
        uint _redeemInterval,
        uint _referralBP,
        uint _price,
        uint _justswapTrxBP,
        uint _justswapTokenBP,
        uint _presaleTokenBP,
        address owner,
        MazePresaleTimer _timer,
        IMazeCertifiableToken _token
    ) external initializer {
        require(_token.isMinter(address(this)), "Presale must be minter.");
        Ownable.initialize(msg.sender);
        ReentrancyGuard.initialize();

        token = _token;
        timer = _timer;

        maxBuyPerAddress = _maxBuyPerAddress;
        minBuyPerAddress = _minBuyPerAddress;

        redeemBP = _redeemBP;

        referralBP = _referralBP;
        redeemInterval = _redeemInterval;

        price = _price;

        justswapTrxBP = _justswapTrxBP;
        justswapTokenBP = _justswapTokenBP;
        presaleTokenBP = _presaleTokenBP;


        //Due to issue in oz testing suite, the msg.sender might not be owner
        _transferOwnership(owner);

        // Real Liquidity Pool
        // comment for testing
        IJustswapFactory factory = IJustswapFactory(address(0x41EED9E56A5CDDAA15EF0C42984884A8AFCF1BDEBB));
        address payable exchange_addr = factory.createExchange(address(token));
        justswapExchange = IJustswapExchange(exchange_addr);
    }

    //    function deposit() external payable {
    //        deposit(address(0x0));
    //    }

    function setTrxPools(
        address payable[] calldata _trxPools,
        uint[] calldata _trxPoolBPs
    ) external onlyOwner {
        require(_trxPools.length == _trxPoolBPs.length, "Must have exactly one trxPool addresses for each BP.");
        delete trxPools;
        delete trxPoolBPs;
        for (uint i = 0; i < _trxPools.length; ++i) {
            trxPools.push(_trxPools[i]);
        }
        uint totalTrxPoolsBP = justswapTrxBP;
        for (uint i = 0; i < _trxPoolBPs.length; ++i) {
            trxPoolBPs.push(_trxPoolBPs[i]);
            totalTrxPoolsBP = totalTrxPoolsBP.add(_trxPoolBPs[i]);
        }
        require(totalTrxPoolsBP == 10000, "Must allocate exactly 100% (10000 BP) of trx to pools");
    }

    function setTokenPools(
        address[] calldata _tokenPools,
        uint[] calldata _tokenPoolBPs
    ) external onlyOwner {
        require(_tokenPools.length == _tokenPoolBPs.length, "Must have exactly one tokenPool addresses for each BP.");
        delete tokenPools;
        delete tokenPoolBPs;
        for (uint i = 0; i < _tokenPools.length; ++i) {
            tokenPools.push(_tokenPools[i]);
        }
        uint totalTokenPoolBPs = justswapTokenBP.add(presaleTokenBP);
        for (uint i = 0; i < _tokenPoolBPs.length; ++i) {
            tokenPoolBPs.push(_tokenPoolBPs[i]);
            totalTokenPoolBPs = totalTokenPoolBPs.add(_tokenPoolBPs[i]);
        }
        require(totalTokenPoolBPs == 10000, "Must allocate exactly 100% (10000 BP) of tokens to pools");
    }

    // No TESTNET for JustSwap at this moment
    // We use this fake function only for testing
    //    function testSendToJustswap(address payable fakeAddr) external whenPresaleFinished nonReentrant {
    //        require(trxPools.length > 0, "Must have set trx pools");
    //        require(tokenPools.length > 0, "Must have set token pools");
    //        require(!hasSentToJustswap, "Has already sent to Justswap.");
    //        finalEndTime = now;
    //        hasSentToJustswap = true;
    //        totalTokens = totalTokens.divBP(presaleTokenBP);
    //        uint justswapTokens = totalTokens.mulBP(justswapTokenBP);
    //        totalTrx = address(this).balance;
    //        uint justswapTrx = totalTrx.mulBP(justswapTrxBP);
    //        token.mint(address(this), justswapTokens);
    //        token.activateTransfers();
    //
    //        // Fake Liquidity Pool Creation
    //        token.approve(fakeAddr, justswapTokens);
    //        token.transfer(fakeAddr, justswapTokens);
    //        fakeAddr.transfer(justswapTrx);
    //
    //    }

    function sendToJustswap() external whenPresaleFinished nonReentrant {
        require(trxPools.length > 0, "Must have set trx pools");
        require(tokenPools.length > 0, "Must have set token pools");
        require(!hasSentToJustswap, "Has already sent to Justswap.");
        finalEndTime = now;
        hasSentToJustswap = true;
        totalTokens = totalTokens.divBP(presaleTokenBP);
        uint justswapTokens = totalTokens.mulBP(justswapTokenBP);
        totalTrx = address(this).balance;
        uint justswapTrx = totalTrx.mulBP(justswapTrxBP);
        token.mint(address(this), justswapTokens);
        token.activateTransfers();

        token.approve(address(justswapExchange), justswapTokens);
        justswapExchange.addLiquidity.value(justswapTrx)(
            justswapTokens,
            justswapTokens,
            now.add(1 hours)
        );
    }

    function issueTokens() external whenPresaleFinished {
        require(hasSentToJustswap, "Has not yet sent to Justswap.");
        require(!hasIssuedTokens, "Has already issued tokens.");
        hasIssuedTokens = true;
        for (uint i = 0; i < tokenPools.length; ++i) {
            token.mint(
                tokenPools[i],
                totalTokens.mulBP(tokenPoolBPs[i])
            );
        }
    }

    function sendTrx() external whenPresaleFinished nonReentrant {
        require(hasSentToJustswap, "Has not yet sent to Justswap.");
        require(!hasSentTrx, "Has already sent trx.");
        hasSentTrx = true;
        for (uint i = 0; i < trxPools.length; ++i) {
            trxPools[i].transfer(
                totalTrx.mulBP(trxPoolBPs[i])
            );
        }
        //remove dust
        if (address(this).balance > 0) {
            trxPools[0].transfer(
                address(this).balance
            );
        }
    }

    function emergencyTrxWithdraw() external whenPresaleFinished nonReentrant onlyOwner {
        require(hasSentToJustswap, "Has not yet sent to Justswap.");
        msg.sender.transfer(address(this).balance);
    }

    function setDepositPause(bool val) external onlyOwner {
        pauseDeposit = val;
    }

    function redeem() external whenPresaleFinished {
        require(hasSentToJustswap, "Must have sent to Justswap before any redeems.");
        uint claimable = calculateRedeemable(msg.sender);
        accountClaimedMaze[msg.sender] = accountClaimedMaze[msg.sender].add(claimable);
        token.mint(msg.sender, claimable);
    }

    function getDepositInTrx(address user) public view returns (uint) {
        return depositAccounts[user];
    }

    function deposit(address payable referrer) public payable whenPresaleActive nonReentrant {
        require(!pauseDeposit, "Deposits are paused.");
        require(
            depositAccounts[msg.sender].add(msg.value) <= maxBuyPerAddress,
            "Deposit exceeds max buy per address."
        );
        require(
            depositAccounts[msg.sender].add(msg.value) >= minBuyPerAddress,
            "Must purchase at least 100 trx."
        );

        if (depositAccounts[msg.sender] == 0) totalDepositors = totalDepositors.add(1);

        uint depositVal = msg.value;
        uint tokensToIssue = depositVal.mul(10 ** 12).mul(getCurrentPrice());
        depositAccounts[msg.sender] = depositAccounts[msg.sender].add(depositVal);

        totalTokens = totalTokens.add(tokensToIssue);

        accountEarnedMaze[msg.sender] = accountEarnedMaze[msg.sender].add(tokensToIssue);

        if (referrer != msg.sender && referrer != address(0x0)) {
            uint referralValue = msg.value.sub(depositVal.subBP(referralBP));
            earnedReferrals[referrer] = earnedReferrals[referrer].add(referralValue);
            referralCounts[referrer] = referralCounts[referrer].add(1);
            referrer.transfer(referralValue);
        }
    }

    function calculateRedeemable(address account) public view returns (uint) {
        if (finalEndTime == 0) return 0;
        uint earnedMaze = accountEarnedMaze[account];
        uint claimedMaze = accountClaimedMaze[account];
        uint cycles = now.sub(finalEndTime).div(redeemInterval).add(1);
        uint totalRedeemable = earnedMaze.mulBP(redeemBP).mul(cycles);
        uint claimable;
        if (totalRedeemable >= earnedMaze) {
            claimable = earnedMaze.sub(claimedMaze);
        } else {
            claimable = totalRedeemable.sub(claimedMaze);
        }
        return claimable;
    }

    function getCurrentPrice() public view returns (uint) {
        uint _price = price;
        if (totalDepositors <= 50) {
            _price = _price.add(3);
        }
        if (totalDepositors <= 100) {
            _price = _price.add(2);
        }
        return _price;
    }

    function isPresaleEnded() public view returns (bool) {
        return (
        (timer.isStarted() && (now > timer.getEndTime(address(this).balance)))
        );
    }

}
