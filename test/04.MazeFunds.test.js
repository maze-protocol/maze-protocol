const {expect} = require("chai")
const config = require("../config")
const {BN, expectRevert} = require("../test-helpers/utils");

const MazeToken = artifacts.require("../contracts/MazeToken.sol")
const MazeTeamFund = artifacts.require("../contracts/MazeTeamFund.sol")
const MazePromoFund = artifacts.require("../contracts/MazePromoFund.sol")
const MazeStakingFund = artifacts.require("../contracts/MazeStakingFund.sol")
const MazePresale = artifacts.require("../contracts/MazePresale.sol")
const MazePresaleTimer = artifacts.require("../contracts/MazePresaleTimer.sol")
const MazeStakingVote = artifacts.require("../contracts/MazeStakingVote.sol")

contract(["MazeTeamFund", "MazePromoFund", "MazeStakingFund"], function (accounts) {

    const owner = accounts[0]
    const buyers = [
        accounts[1], accounts[2], accounts[3], accounts[4]
    ]
    const justSwap = accounts[5]

    before(async function () {

        this.token = await MazeToken.deployed()
        this.teamFund = await MazeTeamFund.deployed()
        this.promoFund = await MazePromoFund.deployed()
        this.stakingFund = await MazeStakingFund.deployed()
        this.presale = await MazePresale.deployed()
        this.timer = await MazePresaleTimer.deployed()
        this.vote = await MazeStakingVote.deployed();

        await this.token.init(
            config.MazeToken.name,
            config.MazeToken.symbol,
            config.MazeToken.decimals,
            owner
        )
        await this.token.addMinter(this.presale.address, {from: owner})
        await this.token.addTrustedContract(this.presale.address, {from: owner})

        await this.stakingFund.init(
            config.MazeStakingFund.authorizer,
            config.MazeStakingFund.releaser,
            this.token.address,
            this.vote.address
        );

        await this.vote.init(
            config.MazeStakingVote.minimalTrxDeposit,
            this.timer.address,
            this.presale.address,
            this.stakingFund.address
        );

        await this.timer.init(
            config.MazePresaleTimer.startTime,
            config.MazePresaleTimer.baseTimer,
            config.MazePresaleTimer.deltaTimer,
            owner
        )
        await this.presale.init(
            config.MazePresale.maxBuyPerAddress,
            config.MazePresale.minBuyPerAddress,
            config.MazePresale.redeemBP,
            //config.MazePresale.redeemInterval
            5,
            config.MazePresale.referralBP,
            config.MazePresale.price,
            config.MazePresale.trxPools.justswapFound,
            config.MazePresale.tokenPools.justswapFound,
            config.MazePresale.tokenPools.presale,
            owner,
            this.timer.address,
            this.token.address
        )

        await this.presale.setTrxPools(
            [
                this.promoFund.address,
                this.teamFund.address
            ],
            [
                config.MazePresale.trxPools.promoFund,
                config.MazePresale.trxPools.teamFund
            ],
            {from: owner}
        )

        await this.presale.setTokenPools(
            [
                this.promoFund.address,
                this.stakingFund.address,
                this.teamFund.address,
            ],
            [
                config.MazePresale.tokenPools.promoFund,
                config.MazePresale.tokenPools.stakingFund,
                config.MazePresale.tokenPools.teamFund
            ],
            {from: owner}
        )

        const hasSentToJustswap = await this.presale.hasSentToJustswap.call();

        if (hasSentToJustswap) {
            throw `Test this file separately: 'NETWORK=development tronbox test ${__filename}'`;
        }

        await this.timer.setStartTime((Math.floor(Date.now() / 1000) - 60).toString(), {from: owner})
        await this.presale.deposit(owner, {
            from: buyers[0],
            callValue: config.MazePresale.minBuyPerAddress,
            shouldPollResponse: true
        });
        await this.presale.deposit(owner, {
            from: buyers[1],
            callValue: config.MazePresale.maxBuyPerAddress,
            shouldPollResponse: true
        });
        await this.presale.deposit(owner, {
            from: buyers[2],
            callValue: config.MazePresale.maxBuyPerAddress,
            shouldPollResponse: true
        });
        await this.presale.deposit(owner, {
            from: buyers[3],
            callValue: config.MazePresale.maxBuyPerAddress,
            shouldPollResponse: true
        });
        await this.timer.setStartTime("1", {from: owner})
        await this.presale.testSendToJustswap(justSwap, {
            shouldPollResponse: true
        });
        await this.presale.issueTokens({
            shouldPollResponse: true
        });
        await this.presale.sendTrx({
            shouldPollResponse: true
        });

    })

    describe("MazeTeamFund", function () {
        describe("Before release", function () {
            it("Current cycle should be 0", async function () {
                const result = BN(await this.teamFund.releaseStart.call({
                    shouldPollResponse: true
                }))
                expect(result.toNumber()).to.equal(0);
            })
        })
        describe("After release", function () {
            before(async function () {
                await this.teamFund.startRelease({
                    shouldPollResponse: true,
                    from: owner
                })
            });
            it("Current cycle should greater than 0", async function () {
                const result = BN(await this.teamFund.releaseStart.call({
                    shouldPollResponse: true
                }))
                expect(result.toNumber()).to.be.above(0);
            })
            it("Balance should be greater than 0", async function () {
                const result = BN(await tronWeb.trx.getBalance(this.teamFund.address));
                expect(result.toNumber()).to.be.above(0);
            })
            it("Should revert - Claim Meze from not a member", async function () {
                const result = await expectRevert(
                    this.teamFund.claimMaze(1, {
                        from: owner,
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            it("Should revert - Claim TRX from not a member", async function () {
                const result = await expectRevert(
                    this.teamFund.claimTrx(1, {
                        from: owner,
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            it("Should revert - Claim Meze from other account", async function () {
                const result = await expectRevert(
                    this.teamFund.claimMaze(1, {
                        from: buyers[0],
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            it("Should revert - Claim TRX from other account", async function () {
                const result = await expectRevert(
                    this.teamFund.claimTrx(1, {
                        from: buyers[0],
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            it("Claimed TRX", async function () {
                const prevBalance = await tronWeb.trx.getBalance(buyers[0]);
                await this.teamFund.claimTrx(0, {
                    from: buyers[0],
                    shouldPollResponse: true
                });
                const nextBalance = await tronWeb.trx.getBalance(buyers[0]);
                expect(parseFloat(tronWeb.fromSun(prevBalance)))
                    .to.be.below(parseFloat(tronWeb.fromSun(nextBalance)));
            })
            it("Claimed MAZE", async function () {
                const prevMazeBalance = BN(await this.token.balanceOf(buyers[0]));
                await this.teamFund.claimMaze(0, {
                    from: buyers[0],
                    shouldPollResponse: true
                });
                const nextMazeBalance = BN(await this.token.balanceOf(buyers[0]));
                expect(prevMazeBalance.toNumber()).to.equal(0);
                expect(prevMazeBalance.toNumber()).to.be.below(nextMazeBalance.toNumber());
            })
        })

    })

    describe("MazePromoFund", function () {

        before(async function () {
            this.releaser = config.MazePromoFund.releaser;
            this.authorizer = config.MazePromoFund.authorizer;
            this.beneficiary = owner;
            this.beneficiaryTrxBalance = BN(await tronWeb.trx.getBalance(this.beneficiary));
            this.beneficiaryMazeBalance = BN(await this.token.balanceOf(this.beneficiary));
            this.fundTrxBalance = BN(await tronWeb.trx.getBalance(this.promoFund.address));
            this.fundMazeBalance = BN(await this.token.balanceOf(this.promoFund.address));
        })


        it("Revert authorize TRX if not authorizer", async function () {
            const result = await expectRevert(this.promoFund.authorizeTrx(this.fundTrxBalance.toString(), {
                from: this.releaser,
                shouldPollResponse: true
            }));
            expect(result).to.equal(true)
        })
        it("Authorize TRX", async function () {
            await this.promoFund.authorizeTrx(this.fundTrxBalance.toString(), {
                from: this.authorizer,
                shouldPollResponse: true
            });
            const result = BN(await this.promoFund.totalTrxAuthorized.call());
            expect(result.toNumber()).to.equal(this.fundTrxBalance.toNumber())
        })
        it("Revert release TRX if not releaser", async function () {
            const result = await expectRevert(this.promoFund.releaseTrxToAddress(
                this.beneficiary,
                this.fundTrxBalance.toString(),
                {
                    from: this.authorizer,
                    shouldPollResponse: true
                }));
            expect(result).to.equal(true)
        })
        it("Release TRX", async function () {
            await this.promoFund.releaseTrxToAddress(
                this.beneficiary,
                this.fundTrxBalance.toString(),
                {
                    from: this.releaser,
                    shouldPollResponse: true
                });
            expect(BN(await tronWeb.trx.getBalance(this.promoFund.address)).toNumber())
                .to.equal(0)
            expect(BN(await tronWeb.trx.getBalance(this.beneficiary))
                .minus(this.beneficiaryTrxBalance)
                .toNumber()
            ).to.equal(this.fundTrxBalance.toNumber())
        })

        it("Revert authorize MAZE if not authorizer", async function () {
            const result = await expectRevert(this.promoFund.authorizeMaze(this.fundMazeBalance.toFixed(), {
                from: this.releaser,
                shouldPollResponse: true
            }));
            expect(result).to.equal(true)
        })
        it("Authorize MAZE", async function () {
            await this.promoFund.authorizeMaze(this.fundMazeBalance.toFixed(), {
                from: this.authorizer,
                shouldPollResponse: true
            });
            const result = BN(await this.promoFund.totalMazeAuthorized.call());
            expect(result.toFixed()).to.equal(this.fundMazeBalance.toFixed())
        })
        it("Revert release MAZE if not releaser", async function () {
            const result = await expectRevert(this.promoFund.releaseMazeToAddress(
                this.beneficiary,
                this.fundMazeBalance.toFixed(),
                {
                    from: this.authorizer,
                    shouldPollResponse: true
                }));
            expect(result).to.equal(true)
        })
        it("Release MAZE", async function () {
            await this.promoFund.releaseMazeToAddress(
                this.beneficiary,
                this.fundMazeBalance.toFixed(),
                {
                    from: this.releaser,
                    shouldPollResponse: true
                });
            BN(await this.token.balanceOf(this.beneficiary))
            expect(BN(await this.token.balanceOf(this.promoFund.address)).toNumber())
                .to.equal(0)
            expect(BN(await this.token.balanceOf(this.beneficiary))
                .minus(this.beneficiaryMazeBalance)
                .toFixed()
            ).to.equal(this.fundMazeBalance.toFixed())
        })
    })

    describe("MazeStakingFund", function () {

        before(async function () {
            this.releaser = config.MazeStakingFund.releaser;
            this.authorizer = config.MazeStakingFund.authorizer;
            this.beneficiary = accounts[5];
            this.beneficiaryMazeBalance = BN(await this.token.balanceOf(this.beneficiary));
            this.fundMazeBalance = BN(await this.token.balanceOf(this.stakingFund.address));
        })
        it("Revert authorize MAZE if not authorizer", async function () {
            const result = await expectRevert(this.stakingFund.authorizeMaze(this.fundMazeBalance.toFixed(), {
                from: this.releaser,
                shouldPollResponse: true
            }));
            expect(result).to.equal(true)
        })
        it("Authorize MAZE", async function () {
            await this.stakingFund.authorizeMaze(this.fundMazeBalance.toFixed(), {
                from: this.authorizer,
                shouldPollResponse: true
            });
            const result = BN(await this.stakingFund.totalMazeAuthorized.call());
            expect(result.toFixed()).to.equal(this.fundMazeBalance.toFixed())
        })
        it("Revert release MAZE if not releaser", async function () {
            const result = await expectRevert(this.stakingFund.releaseMazeToAddress(
                this.beneficiary,
                this.fundMazeBalance.toFixed(),
                {
                    from: this.authorizer,
                    shouldPollResponse: true
                }));
            expect(result).to.equal(true)
        })
        it("Release MAZE", async function () {
            await this.stakingFund.releaseMazeToAddress(
                this.beneficiary,
                this.fundMazeBalance.toFixed(),
                {
                    from: this.releaser,
                    shouldPollResponse: true
                });
            expect(BN(await this.token.balanceOf(this.stakingFund.address)).toNumber())
                .to.equal(0)
            expect(BN(await this.token.balanceOf(this.beneficiary))
                .minus(this.beneficiaryMazeBalance)
                .toFixed()
            ).to.equal(this.fundMazeBalance.toFixed())
        })

        describe("Authorize contract", async function () {

            it("Authorize", async function () {
                await this.stakingFund.authorizeContract(this.token.address, {
                    from: this.authorizer,
                    shouldPollResponse: true
                });
                await this.stakingFund.approveContract(this.token.address, {
                    from: this.releaser,
                    shouldPollResponse: true
                });
                expect(this.token.address).to.equal(await this.stakingFund.releaser.call());
                expect(this.token.address).to.equal(await this.stakingFund.authorizer.call());
            })
        })

    })

});
