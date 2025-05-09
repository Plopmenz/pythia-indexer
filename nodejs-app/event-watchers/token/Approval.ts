import { ContractWatcher } from "../../utils/contract-watcher.js";
import { getTimestamp } from "../eventHelpers.js";
import { Approval } from "../../types/token/events.js";
import { FetchContract } from "../../contracts/Fetch.js";
import { Storage } from "../../types/storage.js";
import { formatUnits } from "viem";

export function watchApproval(
  contractWatcher: ContractWatcher,
  storage: Storage
) {
  contractWatcher.startWatching("Approval", {
    abi: FetchContract.abi,
    address: FetchContract.address,
    eventName: "Approval",
    strict: true,
    onLogs: async (logs) => {
      await Promise.all(
        logs.map(async (log) => {
          const { args, blockNumber, transactionHash, address, logIndex } = log;

          const event = {
            type: "Approval",
            blockNumber,
            transactionHash,
            chainId: contractWatcher.chain.id,
            address: address,
            logIndex: logIndex,
            timestamp: await getTimestamp(
              contractWatcher.chain.id,
              blockNumber
            ),
            ...args,
          } as Approval;

          await processApproval(event, storage);
        })
      );
    },
  });
}

export async function processApproval(
  event: Approval,
  storage: Storage
): Promise<void> {
  storage.query(
    "INSERT INTO fetch_erc20_transfers VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      event.timestamp,
      event.owner,
      event.spender,
      parseFloat(formatUnits(event.value, 18)),
      event.transactionHash,
      event.logIndex,
      event.blockNumber,
    ]
  );
}
