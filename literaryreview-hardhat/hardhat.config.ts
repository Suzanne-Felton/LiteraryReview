import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

// Note: Remove usage of any wallet private key from config to avoid leakage
const PRIVATE_KEY = "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC || process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC_URL || undefined,
      // No private key loaded from env. Use `npx hardhat --network sepolia` with external signer instead.
      accounts: undefined,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deployments: "deployments",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;


