import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const infuraProvider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC);
  const walletProvider = new ethers.BrowserProvider(window.ethereum);
  const ABI=[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"sayHello","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address payable","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"sendEther","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
  
  const getContractData = new ethers.Contract(contractAddress,ABI,infuraProvider);
  const sendContractTx = new ethers.Contract(contractAddress,ABI,walletProvider);

  const networks = {
    baseSepolia: {
      chainId: '0x14a34', // 84532 in hex
      chainName: 'Base Sepolia Testnet',
      nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia.basescan.org'],
    },
    polygonAmoy: {
      chainId: '0x13882', // 80002 in hex
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    },
  };

  const requestAccount = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const selected = accounts[0];
        setAccount(selected);
        await getBalance(selected);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const getBalance = async (addr) => {
    if (window.ethereum && addr) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balanceBigInt = await provider.getBalance(addr);
        const balanceEth = ethers.formatEther(balanceBigInt);
        setBalance(balanceEth);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }
  };

  const switchChain = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found');
      return;
    }

    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(currentChainId);

      const targetChain =
        currentChainId === networks.baseSepolia.chainId
          ? networks.polygonAmoy
          : networks.baseSepolia;

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChain.chainId }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [targetChain],
            });
          } catch (addError) {
            console.error('Error adding chain:', addError);
          }
        } else {
          console.error('Error switching chain:', switchError);
        }
      }
    } catch (error) {
      console.error('Error fetching current chain ID:', error);
    }
  };

  const sendEth = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found');
      return;
    }

    if (!ethers.isAddress(recipient)) {
      alert('Invalid recipient address');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('Invalid amount');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount),
      });
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      await getBalance(account);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };

  // Listen to account or chain change
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      const selected = accounts[0];
      setAccount(selected);
      getBalance(selected);
    };

    const handleChainChanged = (chainId) => {
      setChainId(chainId);
      if (account) getBalance(account);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  const getHelloWorld = async () => {
    try {
      const message = await getContractData.sayHello();
      alert(`Contract says: ${message}`);
    } catch (error) {
      console.error('Error calling sayHello:', error);
      alert('Failed to fetch message from contract');
    }
  };

  const sendToContract = async () => {
    if (!window.ethereum) return alert('MetaMask not found');

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return alert('Invalid amount');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther(amount),
      });
      console.log('Sent ETH to contract:', tx.hash);
      await tx.wait();
      console.log('Confirmed');
      await getBalance(account);
    } catch (err) {
      console.error('Error sending ETH to contract:', err);
    }
  };

  const sendFromContract = async () => {
    if (!window.ethereum) return alert('MetaMask not found');

    if (!ethers.isAddress(recipient)) {
      return alert('Invalid recipient address');
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return alert('Invalid amount');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(contractAddress, ABI, signer);

      const tx = await contractWithSigner.sendEther(
        recipient,
        ethers.parseEther(amount)
      );

      console.log('Contract sent ETH:', tx.hash);
      await tx.wait();
      console.log('Confirmed');
      await getBalance(account);
    } catch (err) {
      console.error('Error sending ETH from contract:', err);
    }
  };

  return (
    <div>
      <button onClick={requestAccount}>{account ? 'Connected' : 'Connect Wallet'}</button>
      {account && (
        <>
          <h3>Account: {account}</h3>
          <h3>Balance: {balance} ETH</h3>
          <h3>Chain ID: {chainId}</h3>
          <button onClick={switchChain}>Switch Network</button>
          <div>
            <h3>Send ETH</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              type="text"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendEth}>Send</button>
          </div>
          <button onClick={getHelloWorld}>Get Hello World</button>

          <div>
            <h3>Send ETH Directly to Contract</h3>
            <input
              type="text"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendToContract}>Send to Contract</button>
          </div>

          <div>
            <h3>Send ETH From Contract to Address</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              type="text"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={sendFromContract}>Send From Contract</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
