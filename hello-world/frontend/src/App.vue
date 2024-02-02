<template>
  <div id="app" v-if="!mainLoading">
    <h1>Greeter says: {{ greeting }} 👋</h1>
    <div class="title">
      This a simple dApp, which can choose fee token and interact with the
      `Greeter` smart contract.
      <p>
        The contract is deployed on the zkSync testnet on
        <a
          :href="`https://sepolia.explorer.zksync.io/address/${GREETER_CONTRACT_ADDRESS}`"
          target="_blank"
          >{{ GREETER_CONTRACT_ADDRESS }}</a
        >
      </p>
    </div>
    <div class="main-box">
      <div>
        Select token:
        <select v-model="selectedTokenAddress" @change="changeToken">
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
          Balance: <span v-if="retrievingBalance">Loading...</span>
          <span v-else>{{ currentBalance }} {{ selectedToken.symbol }}</span>
        </p>
        <p>
          Expected fee: <span v-if="retrievingFee">Loading...</span>
          <span v-else>{{ currentFee }} {{ selectedToken.symbol }}</span>
          <button class="refresh-button" @click="updateFee">Refresh</button>
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
          :disabled="!selectedToken || txStatus != 0 || retrievingFee"
          @click="changeGreeting"
        >
          <span v-if="selectedToken && !txStatus">Change greeting</span>
          <span v-else-if="!selectedToken">Select token to pay fee first</span>
          <span v-else-if="txStatus === 1">Sending tx...</span>
          <span v-else-if="txStatus === 2"
            >Waiting until tx is committed...</span
          >
          <span v-else-if="txStatus === 3">Updating the page...</span>
          <span v-else-if="retrievingFee">Updating the fee...</span>
        </button>
      </div>
    </div>
  </div>
  <div id="app" v-else>
    <div class="start-screen">
      <h1>Welcome to Greeter dApp!</h1>
      <button v-if="correctNetwork" @click="connectMetamask">
        Connect Metamask
      </button>
      <button v-else @click="addZkSyncSepolia">Switch to zkSync Sepolia</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
// TODO: import ethers and zksync-ethers

const GREETER_CONTRACT_ADDRESS = ""; // TODO: insert the Greeter contract address here
import GREETER_CONTRACT_ABI from "./abi.json"; // TODO: Complete and import the ABI

const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";
import allowedTokens from "./eth.json"; // change to "./erc20.json" to use ERC20 tokens

// reactive references
const correctNetwork = ref(false);
const tokens = ref(allowedTokens);
const newGreeting = ref("");
const greeting = ref("");
const mainLoading = ref(true);
const retrievingFee = ref(false);
const retrievingBalance = ref(false);
const currentBalance = ref("");
const currentFee = ref("");
const selectedTokenAddress = ref(null);
const selectedToken = ref<{
  l2Address: string;
  decimals: number;
  symbol: string;
} | null>(null);
// txStatus is a reactive variable that tracks the status of the transaction
// 0 stands for no status, i.e no tx has been sent
// 1 stands for tx is beeing submitted to the operator
// 2 stands for tx awaiting commit
// 3 stands for updating the balance and greeting on the page
const txStatus = ref(0);

let provider: Provider | null = null;
let signer: Wallet | null = null;
let contract: Contract | null = null;

// Lifecycle hook
onMounted(async () => {
  const network = await window.ethereum?.request<string>({
    method: "net_version",
  });
  if (network !== null && network !== undefined && +network === 300) {
    correctNetwork.value = true;
  }
});

// METHODS TO BE IMPLEMENTED
const initializeProviderAndSigner = async () => {
  // TODO: initialize provider and signer based on `window.ethereum`
};

const getGreeting = async () => {
  // TODO: return the current greeting
  return "";
};

const getFee = async () => {
  // TODO: return formatted fee
  return "";
};

const getBalance = async () => {
  // TODO: Return formatted balance
  return "";
};
const getOverrides = async () => {
  if (selectedToken.value?.l2Address != ETH_ADDRESS) {
    // TODO: Return data for the paymaster
  }

  return {};
};
const changeGreeting = async () => {
  txStatus.value = 1;
  try {
    // TODO: Submit the transaction
    txStatus.value = 2;

    // TODO: Wait for transaction compilation
    txStatus.value = 3;

    // Update greeting
    greeting.value = await getGreeting();

    retrievingFee.value = true;
    retrievingBalance.value = true;
    // Update balance and fee
    currentBalance.value = await getBalance();
    currentFee.value = await getFee();
  } catch (e) {
    console.error(e);
    alert(e);
  }

  txStatus.value = 0;
  retrievingFee.value = false;
  retrievingBalance.value = false;
  newGreeting.value = "";
};

const updateFee = async () => {
  retrievingFee.value = true;
  getFee()
    .then((fee) => {
      currentFee.value = fee;
    })
    .catch((e) => console.log(e))
    .finally(() => {
      retrievingFee.value = false;
    });
};
const updateBalance = async () => {
  retrievingBalance.value = true;
  getBalance()
    .then((balance) => {
      currentBalance.value = balance;
    })
    .catch((e) => console.log(e))
    .finally(() => {
      retrievingBalance.value = false;
    });
};
const changeToken = async () => {
  retrievingFee.value = true;
  retrievingBalance.value = true;

  const tokenAddress = tokens.value.filter(
    (t) => t.address === selectedTokenAddress.value,
  )[0];
  selectedToken.value = {
    l2Address: tokenAddress.address,
    decimals: tokenAddress.decimals,
    symbol: tokenAddress.symbol,
  };
  try {
    updateFee();
    updateBalance();
  } catch (e) {
    console.log(e);
  } finally {
    retrievingFee.value = false;
    retrievingBalance.value = false;
  }
};
const loadMainScreen = async () => {
  await initializeProviderAndSigner();

  if (!provider || !signer) {
    alert("Follow the tutorial to learn how to connect to Metamask!");
    return;
  }

  await getGreeting()
    .then((newGreeting) => (greeting.value = newGreeting))
    .catch((e: unknown) => console.error(e));

  mainLoading.value = false;
};
const addZkSyncSepolia = async () => {
  // add zkSync testnet to Metamask
  await window.ethereum?.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x12C",
        chainName: "zkSync Sepolia testnet",
        rpcUrls: ["https://sepolia.era.zksync.dev"],
        blockExplorerUrls: ["https://sepolia.explorer.zksync.io/"],
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
      },
    ],
  });
  window.location.reload();
};
const connectMetamask = async () => {
  await window.ethereum
    ?.request({ method: "eth_requestAccounts" })
    .catch((e: unknown) => console.error(e));

  loadMainScreen();
};
</script>

<style scoped>
input,
select {
  padding: 8px 3px;
  margin: 0 5px;
}
button {
  margin: 0 5px;
}
.title,
.main-box,
.greeting-input,
.balance {
  margin: 10px;
}
</style>
