const config = require("../config");
const {expect} = require("chai");
const MazeTimer = artifacts.require("../contracts/MazePresaleTimer.sol");

contract('MazeTimer', function (accounts) {

    const owner = accounts[0];

    before(async function () {
        this.timer = await MazeTimer.deployed();
        await this.timer.init(
            config.MazePresaleTimer.startTime,
            config.MazePresaleTimer.baseTimer,
            config.MazePresaleTimer.deltaTimer,
            owner
        )
    });

    describe("Starting", function () {
        it("Is started", async function () {
            await this.timer.setStartTime("1", {from: owner})
            const result = await this.timer.isStarted()
            expect(result).to.equal(true)
        })
        it("Isn't started", async function () {
            const future = Math.ceil(Date.now() / 1000) + 20;
            await this.timer.setStartTime(future, {from: owner})
            const result = await this.timer.isStarted()
            expect(result).to.equal(false)
        })
    });

    describe("Ending", function () {
        before(async function () {
            await this.timer.setStartTime(config.MazePresaleTimer.startTime, {from: owner})
        });
        it("baseTimer", async function () {
            const result = await this.timer.getEndTime("0")
            expect(result.toString()).to.equal((config.MazePresaleTimer.baseTimer + config.MazePresaleTimer.startTime).toString())
        })
        it("deltaTime * 7 at 7990000 trx", async function () {
            const actual = await this.timer.getEndTime(tronWeb.toSun(7990000))
            const expected = config.MazePresaleTimer.baseTimer + config.MazePresaleTimer.startTime + config.MazePresaleTimer.deltaTimer * 1
            expect(actual.toString()).to.equal(expected.toString())
        })
        it("deltaTime * 15 at 15010000 trx", async function () {
            const actual = await this.timer.getEndTime(tronWeb.toSun(16010000))
            const expected = config.MazePresaleTimer.baseTimer + config.MazePresaleTimer.startTime + config.MazePresaleTimer.deltaTimer * (4)
            expect(actual.toString()).to.equal(expected.toString())
        })

    });

});
