<template>
  <div id="app" v-if="!mainLoading">
    <h1>Greeter says: {{ greeting }} 👋</h1>
    <div>
      This a simple dApp, which can choose fee token and interact with the
      `Greeter` smart contract.
    </div>
    <div class="main-box">
      <div>
        Select token:
        <select v-model="selectedTokenAddress" v-on:change="changeToken">
          <option
            v-for="token in tokens"
            v-bind:value="token.address"
            v-bind:key="token.address"
          >
            {{ token.symbol }}
          </option>
        </select>
      </div>
      <div class="balance" v-if="selectedToken">
        <p>
          Balance: <span v-if="retreivingBalance">Loading...</span>
          <span v-else>{{ currentBalance }} {{ selectedToken.symbol }}</span>
        </p>
        <p>
          Expected fee: <span v-if="retreivingFee">Loading...</span>
          <span v-else>{{ currentFee }} {{ selectedToken.symbol }}</span>
          <button class="refresh-button" v-on:click="updateFee">Refresh</button>
        </p>
      </div>
      <div class="greeting-input">
        <input
          v-model="newGreeting"
          :disabled="!selectedToken || txStatus != 0"
          placeholder="Write new greeting here..."
        />

        <button
          class="change-button"
          :disabled="!selectedToken || txStatus != 0 || retreivingFee"
          v-on:click="changeGreeting"
        >
          <span v-if="selectedToken && !txStatus">Change greeting</span>
          <span v-else-if="!selectedToken">Select token to pay fee first</span>
          <span v-else-if="txStatus == 1">Sending tx...</span>
          <span v-else-if="txStatus == 2"
            >Waiting until tx is committed...</span
          >
          <span v-else-if="txStatus == 3">Updating the page...</span>
          <span v-else-if="retreivingFee">Updating the fee...</span>
        </button>
      </div>
    </div>
  </div>
  <div id="app" v-else>
    <div class="start-screen">
      <h1>Welcome to Greeter dApp!</h1>
      <button v-on:click="connectMetamask">Connect Metamask</button>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line
const GREETER_CONTRACT_ADDRESS = "0x62A5618Ead43B1CC4EBdb7496B5d578848565ae3"; // TODO: Add smart contract address
// eslint-disable-next-line
const GREETER_CONTRACT_ABI = require("./abi.json"); // TODO: Add link to the ABI

const ETH_L1_ADDRESS = "0x0000000000000000000000000000000000000000";
// const allowedTokens = require("./eth.json");
const allowedTokens = require("./erc20.json");

import { Contract, Web3Provider, Provider, utils } from "zksync-web3";
// `ethers` is only used in this tutorial for its utility functions
import { ethers } from "ethers";

export default {
  name: "App",
  data() {
    return {
      newGreeting: "",
      greeting: "unknown",
      tokens: allowedTokens,
      selectedToken: null,
      selectedTokenAddress: "",
      mainLoading: true,
      provider: null,
      signer: null,
      contract: null,
      canSubmit: true,
      // 0 stands for no status, i.e no tx has been sent
      // 1 stands for tx is beeing submitted to the operator
      // 2 stands for tx awaiting commit
      // 3 stands for updating the balance and greeting on the page
      txStatus: 0,
      retreivingFee: false,
      retreivingBalance: false,

      currentBalance: "",
      currentFee: "",
    };
  },
  methods: {
    initializeProviderAndSigner() {
      // TODO: initialize provider and signer based on `window.ethereum`
      this.provider = new Provider("https://zksync2-testnet.zksync.dev");
      // Note that we still need to get the Metamask signer
      this.signer = new Web3Provider(window.ethereum).getSigner();
      this.contract = new Contract(
        GREETER_CONTRACT_ADDRESS,
        GREETER_CONTRACT_ABI,
        this.signer
      );
    },
    async getGreeting() {
      // TODO: return the current greeting
      return await this.contract.greet();
    },
    async getFee() {
      // Getting the amount of gas (ergs) needed for one transaction
      const feeInGas = await this.contract.estimateGas.setGreeting(
        this.newGreeting
      );
      // Getting the gas price per one erg. For now, it is the same for all tokens.
      const gasPriceInUnits = await this.provider.getGasPrice();

      // To display the number of tokens in the human-readable format, we need to format them,
      // e.g. if feeInGas*gasPriceInUnits returns 500000000000000000 wei of ETH, we want to display 0.5 ETH the user
      return ethers.utils.formatUnits(
        feeInGas.mul(gasPriceInUnits),
        this.selectedToken.decimals
      );
    },
    async getBalance() {
      // Getting the balance for the signer in the selected token
      const balanceInUnits = await this.signer.getBalance(
        this.selectedToken.l2Address
      );
      // To display the number of tokens in the human-readable format, we need to format them,
      // e.g. if balanceInUnits returns 500000000000000000 wei of ETH, we want to display 0.5 ETH to the user
      return ethers.utils.formatUnits(
        balanceInUnits,
        this.selectedToken.decimals
      );
    },
    async getOverrides() {
      if (this.selectedToken.l1Address != ETH_L1_ADDRESS) {
        const testnetPaymaster =
          await this.provider.getTestnetPaymasterAddress();

        const gasPrice = await this.provider.getGasPrice();

        // estimate gasLimit via paymaster
        const gasLimit = await this.contract.estimateGas.setGreeting(
          this.newGreeting,
          {
            customData: {
              ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
              paymasterParams: {
                paymaster: testnetPaymaster,
                // empty input as our paymaster doesn't require additional data
                paymasterInput: "0x",
              },
            },
          }
        );

        console.log("gasLimit :>> ", gasLimit);

        const fee = gasPrice.mul(gasLimit.toString());

        const paymasterParams = utils.getPaymasterParams(testnetPaymaster, {
          type: "ApprovalBased",
          token: this.selectedToken.l2Address,
          minimalAllowance: fee,
          // empty bytes as testnet paymaster does not use innerInput
          innerInput: new Uint8Array(),
        });

        return {
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: ethers.BigNumber.from(0),
          gasLimit,
          customData: {
            ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
            paymasterParams,
          },
        };
      }

      return {};
    },
    async changeGreeting() {
      this.txStatus = 1;
      try {
        const txHandle = await this.contract.setGreeting(
          this.newGreeting,
          await this.getOverrides()
        );

        this.txStatus = 2;

        // Wait until the transaction is committed
        await txHandle.wait();
        this.txStatus = 3;

        // Update greeting
        this.greeting = await this.getGreeting();

        this.retreivingFee = true;
        this.retreivingBalance = true;
        // Update balance and fee
        this.currentBalance = await this.getBalance();
        this.currentFee = await this.getFee();
      } catch (e) {
        alert(JSON.stringify(e));
      }

      this.txStatus = 0;
      this.retreivingFee = false;
      this.retreivingBalance = false;
    },

    updateFee() {
      this.retreivingFee = true;
      this.getFee()
        .then((fee) => {
          this.currentFee = fee;
        })
        .catch((e) => console.log(e))
        .finally(() => {
          this.retreivingFee = false;
        });
    },
    updateBalance() {
      this.retreivingBalance = true;
      this.getBalance()
        .then((balance) => {
          this.currentBalance = balance;
        })
        .catch((e) => console.log(e))
        .finally(() => {
          this.retreivingBalance = false;
        });
    },
    async changeToken() {
      this.retreivingFee = true;
      this.retreivingBalance = true;
      const l1Token = this.tokens.filter(
        (t) => t.address == this.selectedTokenAddress
      )[0];
      // console.log(`${await this.provider.l1TokenAddress(l1Token.address)}`);
      this.provider
        .l2TokenAddress(l1Token.address)
        .then((l2Address) => {
          this.selectedToken = {
            l1Address: l1Token.address,
            l2Address: l2Address,
            decimals: l1Token.decimals,
            symbol: l1Token.symbol,
          };
          this.updateFee();
          this.updateBalance();
        })
        .catch((e) => console.log(e))
        .finally(() => {
          this.retreivingFee = false;
          this.retreivingBalance = false;
        });
    },
    loadMainScreen() {
      this.initializeProviderAndSigner();

      if (!this.provider || !this.signer) {
        alert("Follow the tutorial to learn how to connect to Metamask!");
        return;
      }

      this.getGreeting().then((greeting) => {
        this.greeting = greeting;
        this.mainLoading = false;
      });
    },
    connectMetamask() {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then(() => {
          if (+window.ethereum.networkVersion == 280) {
            this.loadMainScreen();
          } else {
            alert("Please switch network to zkSync!");
          }
        })
        .catch((e) => console.log(e));
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 30px;
}

#app ul {
  display: inline-block;
}

.main-box {
  text-align: left;
  width: 400px;

  margin: auto;
  margin-top: 40px;
}

.greeting-input {
  margin-top: 20px;
}

.change-button {
  margin-left: 20px;
}

.start-screen {
  margin-top: 100px;
}

.balance {
  margin-top: 10px;
}

.refresh-button {
  margin-left: 15px;
}
</style>
