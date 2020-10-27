const config = require("../config")
const {expect} = require("chai")
const MazeToken = artifacts.require("../contracts/MazeToken.sol")
const {toMaze, expectRevert} = require("../test-helpers/utils");


contract("MazeToken", function (accounts) {

    const owner = accounts[0]
    const transferFromAccounts = [accounts[1], accounts[2], accounts[3], accounts[9]]
    const transferToAccounts = [accounts[4], accounts[5], accounts[6], accounts[10]]
    const approvedSender = accounts[7]

    before(async function () {
        this.token = await MazeToken.deployed()
        await this.token.init(
            config.MazeToken.name,
            config.MazeToken.symbol,
            config.MazeToken.decimals,
            owner
        )
        await this.token.mint(owner, toMaze(100000), {from: owner});
        await this.token.mint(transferFromAccounts[0], toMaze(100000), {from: owner});
        await this.token.mint(transferFromAccounts[1], toMaze(100000), {from: owner});
        await this.token.mint(transferFromAccounts[2], toMaze(100000), {from: owner});
    })

    describe("!isTransfersActive", function () {
        describe("isTransfersActive", function () {
            it("Nope", async function () {
                let isTransfersActive = await this.token.isTransfersActive()
                expect(isTransfersActive).to.equal(false)
            })
        })
        describe("Transfer", function () {
            it("Revert.", async function () {
                const result = await expectRevert(this.token.transfer(transferToAccounts[0], toMaze(100000 + 1), {
                    from: transferFromAccounts[0],
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
        })
        describe("Transfer From", function () {
            it("Revert", async function () {
                const to = transferToAccounts[1]
                const from = transferFromAccounts[1]
                const result = await expectRevert(this.token.transferFrom(from, to, toMaze(50000 + 1), {
                    from: approvedSender,
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
        })
    })

    describe("isTransfersActive", function () {
        before(async function () {
            await this.token.setIsTransfersActive(true, {from: owner})
        })
        describe("isTransfersActive", function () {
            it("Oh it is.", async function () {
                let isTransfersActive = await this.token.isTransfersActive()
                expect(isTransfersActive).to.equal(true)
            })
        })
        describe("Transfers", function () {
            it("Revert if msg.from sends more than their balance", async function () {
                const result = await expectRevert(this.token.transfer(transferToAccounts[0], toMaze(100000 + 1), {
                    from: transferFromAccounts[0],
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true);
            })
            it("Increase to by value", async function () {
                const to = transferToAccounts[0]
                const from = transferFromAccounts[0]
                const toPreviousBalance = await this.token.balanceOf(to)
                await this.token.transfer(to, toMaze(10000), {from: from})
                const toNextBalance = await this.token.balanceOf(to)
                expect(toNextBalance.toString()).to.equal(toPreviousBalance.add(toMaze(10000)).toString())
            })
            it("Decrease from by value", async function () {
                const to = transferToAccounts[0]
                const from = transferFromAccounts[0]
                const fromPreviousBalance = await this.token.balanceOf(from)
                await this.token.transfer(to, toMaze(10000), {from: from})
                const fromNextBalance = await this.token.balanceOf(from)
                expect(fromNextBalance.toString()).to.equal(fromPreviousBalance.sub(toMaze(10000)).toString())
            })
        })
        describe("Transfer from", function () {
            before(async function () {
                await this.token.approve(approvedSender, toMaze(20000), {from: transferFromAccounts[1]})
            })
            it("Revert if msg.from does not have enough approved", async function () {
                const to = transferToAccounts[1]
                const from = transferFromAccounts[1]
                const result = await expectRevert(this.token.transferFrom(from, to, toMaze(50000 + 1), {
                    from: approvedSender,
                    shouldPollResponse: true
                }));
                expect(result).to.equal(true)
            })
            it("Increase to by value", async function () {
                const to = transferToAccounts[1]
                const from = transferFromAccounts[1]
                const toPreviousBalance = await this.token.balanceOf(to)
                await this.token.transferFrom(from, to, toMaze(10000), {from: approvedSender})
                const toNextBalance = await this.token.balanceOf(to)
                expect(toNextBalance.toString()).to.equal(toPreviousBalance.add(toMaze(10000)).toString())
            })
            it("Decrease from by value", async function () {
                const to = transferToAccounts[1]
                const from = transferFromAccounts[1]
                const fromPreviousBalance = await this.token.balanceOf(from)
                await this.token.transferFrom(from, to, toMaze(10000), {from: approvedSender})
                const fromNextBalance = await this.token.balanceOf(from)
                expect(fromNextBalance.toString()).to.equal(fromPreviousBalance.sub(toMaze(10000)).toString())
            })
        })
    })

})
