let config = {}

config.MazeToken = {
  name: "MAZE Token",
  symbol: "MAZE",
  decimals: 18
}

config.MazePresale = {
  maxBuyPerAddress: 200000000000,
  minBuyPerAddress: 100000000,
  redeemBP: 200,
  redeemInterval: 3600,
  referralBP: 250,
  price: 50, // MAZE per TRX
  trxPools: {
    promoFund: 500,
    teamFund: 4000,
    justswapFound: 5500
  },
  tokenPools: {
    promoFund: 1000,
    stakingFund: 1000,
    teamFund: 1000,
    presale: 5000,
    justswapFound: 2000
  }
}

config.MazeStakingVote = {
  minimalTrxDeposit: 50000000000
}

config.MazePresaleTimer = {
  startTime: 1604080800,
  baseTimer: 14 * 24 * 3600,
  deltaTimer: 24 * 3600,
}

config.MazeTeamFund = {
  releaseInterval: 86400,
  releaseBP: 5,
  addresses: [
    "TJA85KHCAbNgo1FGEVr6FJRVgDHGPr2ANX",
    "TPgM3sktZJVMHb3RfJXmttnKZxfMLYRW4i",
    "TXgjtGqkREHAK4iPkfQvDZkM2WVAWzex7G"
  ],
  basisPoints: [
    3500,
    3500,
    3000
  ]
}

config.MazePromoFund = {
  authorizer: "TSYfst19bEjLXALrtSWEFSTx2sRoNXERg1",
  releaser: "TDfit9VV5sT1iR8aQGBcqVQbH6DAR51WkC"
}

config.MazeStakingFund = {
  authorizer: "TSYfst19bEjLXALrtSWEFSTx2sRoNXERg1",
  releaser: "TDfit9VV5sT1iR8aQGBcqVQbH6DAR51WkC"
}

if (process.env.NETWORK === 'development') {

  const addresses = [
    "TJA85KHCAbNgo1FGEVr6FJRVgDHGPr2ANX",
    "TPgM3sktZJVMHb3RfJXmttnKZxfMLYRW4i",
    "TXgjtGqkREHAK4iPkfQvDZkM2WVAWzex7G"
  ];

  config.MazeTeamFund = {
    ...config.MazeTeamFund,
    releaseInterval: 10,
    addresses: addresses
  }

  config.MazeStakingFund = {
    ...config.MazeStakingFund,
    authorizer: addresses[0],
    releaser: addresses[1]
  }

  config.MazePromoFund = {
    ...config.MazePromoFund,
    authorizer: addresses[0],
    releaser: addresses[1]
  }

  config.MazePresaleTimer = {
    ...config.MazePresaleTimer,
    baseTimer: 0.25 * 3600,
  }

  config.MazePresale = {
    ...config.MazePresale,
    maxBuyPerAddress: 2000000000,
    redeemInterval: 60
  }

  config.MazeStakingVote = {
    ...config.MazeStakingVote,
    minimalTrxDeposit: parseInt((config.MazePresale.minBuyPerAddress + config.MazePresale.maxBuyPerAddress) / 2)
  }
}


module.exports = config
