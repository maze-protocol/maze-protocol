const port = process.env.HOST_PORT || 9090
const privatekey = require('./privatekey')

module.exports = {
  networks: {
    mainnet: {
      privateKey: privatekey.mainnet.privatekey,
      userFeePercentage: 100,
      feeLimit: 1e8,
      fullHost: 'https://api.trongrid.io',
      network_id: '1'
    },
    shasta: {
      privateKey: privatekey.shasta.privatekey,
      userFeePercentage: 50,
      feeLimit: 1e8,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2'
    },
    nile: {
      privateKey: privatekey.nile.privatekey,
      fullNode: 'https://api.nileex.io/wallet',
      solidityNode: 'https://api.nileex.io/walletsolidity',
      eventServer: 'https://event.nileex.io',
      network_id: '3'
    },
    tronex: {
      privateKey: privatekey.tronex.privatekey,
      fillNode: 'https://testhttpapi.tronex.io/wallet',
      solidityNode: 'https://testhttpapi.tronex.io/walletsolidity',
      network_id: '4'
    },
    development: {
      // For trontools/quickstart docker image
      privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      userFeePercentage: 0,
      // feeLimit: 1e8,
      fullHost: 'http://127.0.0.1:' + port,
      network_id: '9'
    },
    compilers: {
      solc: {
        version: '0.5.10'
      }
    }
  }
}
