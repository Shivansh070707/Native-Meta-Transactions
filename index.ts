import * as sigUtil from 'eth-sig-util';
const contract_address = '0x42a4651B8bB65a9B451f470Bf00D72f691DD90DB'; // additional dependency
import * as abi from '../abi.json';
import { Biconomy } from '@biconomy/mexa';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
export type ExternalProvider = {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  send?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  request?: (request: { method: string; params?: Array<any> }) => Promise<any>;
};
async function main() {
  let walletProvider, walletSigner;

  walletProvider = new ethers.providers.JsonRpcProvider(
    'http://localhost:24012/rpc'
  );
  walletSigner = walletProvider.getSigner();
  // Initialize Constants
  const biconomy = new Biconomy(
    'http://localhost:24012/rpc' as ExternalProvider,
    {
      apiKey: '45a5d621-dff8-4ff0-9a3b-8626c91fdbf2',
      debug: true,
      contractAddresses: [contract_address], // list of contract address you want to enable gasless on
    }
  );
  await biconomy.init();

  let contractInterface = new ethers.utils.Interface(abi.abi);

  let userAddress = '0x6e24689C13AeE0fabe6552f655607B71Cb425a44';
  let privateKey =
    '83e2a2a92cf8b81f68dd13aa795b1be2cff51c2a444bdc63d84026736a821f60';
  let contract = new ethers.Contract(
    contract_address,
    abi.abi,
    biconomy.getSignerByAddress(userAddress)
  );

  let userSigner = new ethers.Wallet(privateKey);

  // Create your target method signature.. here we are calling setQuote() method of our contract
  let functionSignature = contractInterface.encodeFunctionData('foo', [1]);

  let rawTx = {
    to: contract_address,
    data: functionSignature,
    from: userAddress,
  };

  let signedTx = await userSigner.signTransaction(rawTx);
  // should get user message to sign for EIP712 or personal signature types
  const forwardData = await biconomy.getForwardRequestAndMessageToSign(
    signedTx
  );
  console.log(forwardData);

  // optionally one can sign using sigUtil
  const signature: any = sigUtil.signTypedMessage(
    new Buffer.from(privateKey, 'hex'),
    { data: forwardData.eip712Format },
    'V3'
  );

  let data = {
    signature: signature,
    forwardRequest: forwardData.request,
    rawTransaction: signedTx,
    signatureType: biconomy.EIP712_SIGN,
  };

  let provider = biconomy.getEthersProvider();
  // send signed transaction with ethers
  // promise resolves to transaction hash
  let txHash = await provider.send('eth_sendRawTransaction', [data]);

  let receipt = await provider.waitForTransaction(txHash);
  //do something
}
main();
