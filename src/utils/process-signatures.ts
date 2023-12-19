import { BigNumber, ethers, Transaction } from 'ethers';
import { LogsContextInterface } from '../context/logs';
import { SignatureDto } from './hooks';
import RelayCache from './relay-cache';

type ProcessInput = {
  signatures: SignatureDto[];
  wallet: ethers.Wallet | null;
  provider: ethers.providers.Provider | null;
  writeLog: LogsContextInterface['writeLog'];
  shouldCancel: React.MutableRefObject<boolean>;
  gasPriceGwei?: BigNumber;
  gasPriceFastGwei?: BigNumber;
  doffa?: boolean;
  cxoRelayWithSigner: ethers.Contract;
};

type EthersError = {
  code: ethers.errors;
};

export async function processSignatures({
  signatures,
  wallet,
  provider,
  writeLog,
  shouldCancel,
  gasPriceGwei,
  gasPriceFastGwei,
  doffa,
  cxoRelayWithSigner,
}: ProcessInput) {
  if (!signatures) {
    writeLog.info('No signatures, canceling.');
    return;
  }
  if (!wallet) {
    writeLog.info('No wallet, canceling.');
    return;
  }
  if (!provider) {
    writeLog.info('No provider, canceling.');
    return;
  }

  // We sort the signatures by times_shown (ascending)
  // to increase the chance of relay success
  signatures.sort(signatureOrder);

  if (shouldCancel.current) {
    writeLog.info('Cancel requested');
    return;
  }

  const processSignature = async (signature: SignatureDto) => {
    if (RelayCache.wasAlreadyProcessed(signature.id)) {
      //writeLog.info('Skipping (already processed) ' + signature.id);
      return;
    }

    writeLog.info('----------------------------------------------------');

    let gas;
    if (!doffa && signature.times_shown > 0) {
      writeLog.info(
        'Processing signature (free for all document) ' + signature.id
      );
      gas = gasPriceFastGwei;
      // return;
    } else {
      writeLog.info('Processing signature ' + signature.id);
      gas = gasPriceGwei;
    }

    writeLog.info('Sending transaction...');

    const callOptions = {
      maxFeePerGas: gas,
      maxPriorityFeePerGas: gas,
      //gasLimit: gas,
    };

    try {
      writeLog.info(
        'Transaction gas: ' + (gas as unknown as number) / 1000000000
      );
      const tx = await cxoRelayWithSigner.relayCall(
        signature.from,
        signature.recipient,
        signature.encoded_function,
        signature.nonce,
        signature.signature,
        signature.reward,
        signature.reward_recipient,
        signature.reward_signature,
        callOptions
      );
      writeLog.info('Transaction hash: ' + (tx as Transaction).hash);
    } catch (e) {
      const error = e as EthersError;
      if (error.code == 'NETWORK_ERROR') {
        writeLog.error(
          'Problem connecting to the Polygon node, check your configuration or try again later'
        );
        return;
      }
      writeLog.error('Cannot relay: ' + extractErrorMessage(e));
    } finally {
      RelayCache.markAsProcessed(signature.id);
    }
  };

  await Promise.all(signatures.map(processSignature));

  //writeLog.info('Done!');
}

function signatureOrder(sig1: SignatureDto, sig2: SignatureDto) {
  if (sig1.times_shown < sig2.times_shown) {
    return -1;
  }
  if (sig1.times_shown > sig2.times_shown) {
    return 1;
  }
  return 0;
}

function extractErrorMessage(e: any) {
  let message = e.toString();
  try {
    message = `${e.reason} (${e.code})`;
  } catch {
    // We use dump the whole e obj as string
  }

  return message;
}
