const {expect} = require("chai")
const config = require("../config")
const {BN, toMaze, expectRevert} = require("../test-helpers/utils");

const MazeToken = artifacts.require("../contracts/MazeToken.sol")
const MazeTeamFund = artifacts.require("../contracts/MazeTeamFund.sol")
const MazePromoFund = artifacts.require("../contracts/MazePromoFund.sol")
const MazeStakingFund = artifacts.require("../contracts/MazeStakingFund.sol")
const MazePresale = artifacts.require("../contracts/MazePresale.sol")
const MazePresaleTimer = artifacts.require("../contracts/MazePresaleTimer.sol")
const MazeStakingVote = artifacts.require("../contracts/MazeStakingVote.sol")


contract(["MazePresale", "MazeStakingVote"], function (accounts) {

    const owner = accounts[0]
    const buyers = [
        accounts[1], accounts[2], accounts[3], accounts[4]
    ]
    const justSwap = accounts[8]

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

    })
    describe("Before Presale", function () {
        before(async function () {
            await this.timer.setStartTime((Math.floor(Date.now() / 1000) + 3600).toString(), {from: owner})
        })
        describe("Deposit", function () {
            it("Revert", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(this.presale.deposit(owner, {
                    from: buyer,
                    callValue: config.MazePresale.minBuyPerAddress + tronWeb.toSun(1),
                    shouldPollResponse: true
                }))
                expect(result).to.equal(true)
            })
        })
        describe("Send to LP - JustSwap", function () {
            it("Revert", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(this.presale.testSendToJustswap(justSwap, {
                    from: buyer,
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
        })
    })
    describe("Presale", function () {
        before(async function () {
            await this.timer.setStartTime((Math.floor(Date.now() / 1000) - 60).toString(), {from: owner})
        })
        describe("Send to LP - JustSwap", function () {
            it("Revert", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(this.presale.testSendToJustswap(justSwap, {
                    from: buyer,
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
        })

        describe("Buy", function () {
            it("Revert if more than maxBuyPerAddress", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(
                    this.presale.deposit(owner, {
                        from: buyer,
                        callValue: config.MazePresale.maxBuyPerAddress + tronWeb.toSun(1),
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            it("Revert if less than minBuyPerAddress", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(
                    this.presale.deposit(owner, {
                        from: buyer,
                        callValue: config.MazePresale.minBuyPerAddress - tronWeb.toSun(1),
                        shouldPollResponse: true
                    }));
                expect(result).to.equal(true)
            })
            describe("Presale", function() {

                before(async function () {
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
                });

                it("Deposit", async function() {
                    const prevBalance = await tronWeb.trx.getBalance(this.presale.address);
                    expect(parseFloat(tronWeb.fromSun(prevBalance)))
                        .to.equal(parseFloat(tronWeb.fromSun(
                            BN(config.MazePresale.maxBuyPerAddress).multipliedBy(3)
                                .plus(config.MazePresale.minBuyPerAddress).multipliedBy(0.975)
                        )));

                });

                it("Vote revert if deposit is too low", async function () {
                    const result = await expectRevert(
                        this.vote.vote(await this.vote.BURN.call(), {
                            from: buyers[0],
                            shouldPollResponse: true
                        }));
                    expect(result).to.equal(true)
                });

                it("Vote", async function () {
                    await this.vote.vote(1, {
                        from: buyers[1],
                        shouldPollResponse: true
                    })
                    await this.vote.vote(1, {
                        from: buyers[2],
                        shouldPollResponse: true
                    })
                    await this.vote.vote(2, {
                        from: buyers[3],
                        shouldPollResponse: true
                    })
                    const votersCount = BN(await this.vote.votersCount.call());
                    const burnCount = BN(await this.vote.burnCount.call());
                    const stakeMazeCount = BN(await this.vote.stakeMazeCount.call());
                    const stakeMazeTrxCount = BN(await this.vote.stakeMazeTrxCount.call());
                    const stakeMazeMultiCount = BN(await this.vote.stakeMazeMultiCount.call());

                    expect(votersCount.toNumber()).to.equal(3)
                    expect(burnCount.toNumber()).to.equal(2)
                    expect(stakeMazeCount.toNumber()).to.equal(1)
                    expect(stakeMazeTrxCount.toNumber()).to.equal(0)
                    expect(stakeMazeMultiCount.toNumber()).to.equal(0)
                })

            })
        })
    })
    describe("After presale", function () {
        before(async function () {
            await this.timer.setStartTime("1", {from: owner})
        })
        describe("Deposit", function () {
            it("Revert", async function () {
                const buyer = buyers[0]
                const result = await expectRevert(this.presale.deposit(owner, {
                    from: buyer,
                    callValue: config.MazePresale.maxBuyPerAddress,
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
        })
        describe("Divide tokens", function () {
            let totalTokens;
            let presaleTrxBalance;
            before(async function () {
                totalTokens = BN(await this.presale.totalTokens.call());
                presaleTrxBalance = BN(await tronWeb.trx.getBalance(this.presale.address));
            })
            it("Send to LP - JustSwap", async function () {

                totalTokens = totalTokens.dividedToIntegerBy(
                    config.MazePresale.tokenPools.presale / 10000
                );

                const prevBalance = await tronWeb.trx.getBalance(justSwap);

                const trxForJustSwap = presaleTrxBalance.multipliedBy(
                    config.MazePresale.trxPools.justswapFound / 10000
                ).integerValue();

                const tokensForJustSwap = totalTokens.multipliedBy(
                    config.MazePresale.tokenPools.justswapFound / 10000
                ).integerValue();


                await this.presale.testSendToJustswap(justSwap, {
                    shouldPollResponse: true
                });

                const nextBalance = await tronWeb.trx.getBalance(justSwap);
                const nextMazeBalance = BN(await this.token.balanceOf(justSwap));

                expect(parseFloat(tronWeb.fromSun(nextBalance)))
                    .to.equal(parseFloat(tronWeb.fromSun(prevBalance + trxForJustSwap.toNumber())))

                expect(nextMazeBalance.toNumber()).to.equal(tokensForJustSwap.toNumber());

            })
            it("Issue tokens", async function () {
                await this.presale.issueTokens({
                    shouldPollResponse: true
                });
                expect(BN(await this.token.balanceOf(this.promoFund.address)).toNumber())
                    .to.equal(totalTokens.multipliedBy(
                    config.MazePresale.tokenPools.promoFund / 10000
                ).integerValue().toNumber());
                expect(BN(await this.token.balanceOf(this.stakingFund.address)).toNumber())
                    .to.equal(totalTokens.multipliedBy(
                    config.MazePresale.tokenPools.stakingFund / 10000
                ).integerValue().toNumber());
                expect(BN(await this.token.balanceOf(this.teamFund.address)).toNumber())
                    .to.equal(totalTokens.multipliedBy(
                    config.MazePresale.tokenPools.teamFund / 10000
                ).integerValue().toNumber());
            });
            it("Send TRX", async function () {

                const prevPromoBalance = await tronWeb.trx.getBalance(this.promoFund.address);
                const prevTeamBalance = await tronWeb.trx.getBalance(this.teamFund.address);

                const trxForPromo = presaleTrxBalance.multipliedBy(
                    config.MazePresale.trxPools.promoFund / 10000
                ).integerValue();
                const trxForTeam = presaleTrxBalance.multipliedBy(
                    config.MazePresale.trxPools.teamFund / 10000
                ).integerValue();

                await this.presale.sendTrx({
                    shouldPollResponse: true
                });

                const nextPromoBalance = await tronWeb.trx.getBalance(this.promoFund.address);
                const nextTeamBalance = await tronWeb.trx.getBalance(this.teamFund.address);

                expect(parseFloat(tronWeb.fromSun(nextPromoBalance)))
                    .to.equal(parseFloat(tronWeb.fromSun(prevPromoBalance + trxForPromo.toNumber())))

                expect(parseFloat(tronWeb.fromSun(nextTeamBalance)))
                    .to.equal(parseFloat(tronWeb.fromSun(prevTeamBalance + trxForTeam.toNumber())))
            });
            it("Burn Staking Fund", async function () {

                expect(BN(await this.token.balanceOf(this.stakingFund.address)).toNumber())
                    .to.not.equal(0);

                await this.vote.burn({
                    shouldPollResponse: true
                });

                expect(BN(await this.token.balanceOf(this.stakingFund.address)).toNumber())
                    .to.equal(0);
            })
        })
        describe("Reedem", function () {
            it("Reedem", async function () {
                const buyer = buyers[1];
                const redeemable = BN(await this.presale.calculateRedeemable(buyer, {
                    shouldPollResponse: true
                }));
                expect(redeemable.toNumber()).to.be.above(0);
            })
        })
    })

})
