const hre = require("hardhat");

async function main() {
  console.log("Deploying HealthRecordRegistry contract...");

  // Get the contract factory
  const HealthRecordRegistry = await hre.ethers.getContractFactory("HealthRecordRegistry");
  
  // Deploy the contract
  const registry = await HealthRecordRegistry.deploy();
  
  // Wait for deployment
  await registry.waitForDeployment();
  
  const contractAddress = await registry.getAddress();
  
  console.log("");
  console.log("✅ HealthRecordRegistry deployed successfully!");
  console.log("📍 Contract Address: " + contractAddress);
  console.log("");
  console.log("📝 Update your .env file with:");
  console.log("BLOCKCHAIN_CONTRACT_ADDRESS=" + contractAddress);
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("");
  console.log("🌐 Network: " + network.name + " (Chain ID: " + network.chainId + ")");
  
  if (network.name === "sepolia") {
    console.log("");
    console.log("🔍 View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
