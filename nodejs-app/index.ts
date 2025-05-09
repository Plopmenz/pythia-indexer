import { mainnet } from "viem/chains";

import { MultichainWatcher } from "./utils/multichain-watcher.js";
import { watchApproval } from "./event-watchers/token/Approval.js";
import { watchTransfer } from "./event-watchers/token/Transfer.js";
import { infuraApiKey, dbConnectionString } from "./utils/env.js";
import { Storage } from "./types/storage.js";
import { Pool } from "pg";
import { publicClients } from "./utils/chain-cache.js";
import { formatUnits } from "viem";

export let multichainWatcher: MultichainWatcher;

async function start() {
  // Make contract watcher for each chain (using Infura provider)
  multichainWatcher = new MultichainWatcher([
    {
      chain: mainnet,
      rpc: `mainnet.infura.io/ws/v3/${infuraApiKey()}`,
    },
  ]);

  const storage: Storage = new Pool({
    connectionString: dbConnectionString(),
  });

  multichainWatcher.forEach((contractWatcher) => {
    publicClients[contractWatcher.chain.id].watchBlocks({
      poll: true,
      includeTransactions: true,
      onBlock: (block) => {
        storage.query(
          "INSERT INTO ethereum_blocks VALUES ($1, $2, $3, $4, $5, $6)",
          [
            block.timestamp,
            block.number,
            block.hash,
            block.extraData,
            block.size,
            block.gasUsed,
          ]
        );

        block.transactions.forEach((tx) => {
          storage.query(
            "INSERT INTO ethereum_transactions VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [
              block.timestamp,
              tx.hash,
              tx.from,
              tx.to,
              parseFloat(formatUnits(tx.value, 18)),
              tx.gas,
              tx.gasPrice ? parseFloat(formatUnits(tx.gasPrice, 9)) : undefined,
              tx.input,
              tx.blockNumber,
            ]
          );
        });
      },
    });

    watchApproval(contractWatcher, storage);
    watchTransfer(contractWatcher, storage);
  });
}

start().catch(console.error);
