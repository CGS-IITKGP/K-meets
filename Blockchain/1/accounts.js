import { Wallet, JsonRpcProvider, formatEther, parseEther, Contract } from "ethers";
import { config } from "dotenv";
import {ABI} from "./contract/abi.js";
config();

const RPC = process.env.RPC;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;


const provider = new JsonRpcProvider(RPC);
const wallet = new Wallet(privateKey, provider);
const account = wallet.address; 
const contract = new Contract(contractAddress, ABI, wallet);


async function getAccountBalance() {
    try {
        const balance = await provider.getBalance(account);
        console.log(`Balance of ${account}: ${formatEther(balance)} ETH`);
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

async function sendETH(amount, anotherAcc) {
    try {
        const tx = await wallet.sendTransaction({
            to: anotherAcc,
            value: parseEther(amount),
            gasLimit: 210000, // smart conract consomes more gas
        });
        console.log(tx);
        await tx.wait();
        console.log("Transaction confirmed!");
    } catch (error) {
        console.error("Error sending ETH:", error);
    }
}

async function getContractBalance() {
    try {
        const balance = await provider.getBalance(contractAddress);
        console.log(`ETH balance of contract: ${formatEther(balance)} ETH`);
    } catch (error) {
        console.error("Error fetching contract balance:", error);
    }
}

async function getContractOwner() {
    try {
        const owner = await contract.owner();
        console.log(`Contract owner: ${owner}`);
    } catch (error) {
        console.error("Error fetching contract owner:", error);
    }
}

async function sayHello() {
    try {
        const greeting = await contract.sayHello();
        console.log(`Greeting from contract: ${greeting}`);
    } catch (error) {
        console.error("Error calling sayHello:", error);
    }
}

async function sendEtherFromContract(toAddress, amountInEther) {
  try {
    const tx = await contract.sendEther(toAddress, parseEther(amountInEther));
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed!");
  } catch (error) {
    console.error("Error sending Ether from contract:", error);
  }
}

async function main(){
    await getAccountBalance();
    // await sendETH("0.05",contractAddress);
    // await getAccountBalance();
    // await getContractBalance();
    // await getContractOwner();
    await sayHello();
    await sendEtherFromContract(account, "0.0019999");
    await getContractBalance();
    await getAccountBalance();
}


main()