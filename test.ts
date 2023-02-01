import { ethers } from 'hardhat';

async function main() {
  const Test = await ethers.getContractFactory('TestContract');
  const test = await Test.deploy();

  await test.deployed();
  console.log(test.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
