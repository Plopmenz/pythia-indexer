import { mainnet } from "viem/chains";

import { MultichainWatcher } from "./utils/multichain-watcher.js";
import { watchApproval } from "./event-watchers/fetch/Approval.js";
import { watchTransfer } from "./event-watchers/fetch/Transfer.js";
import { infuraApiKey, dbConnectionString } from "./utils/env.js";
import { Storage } from "./types/storage.js";
import { Pool } from "pg";
import { publicClients } from "./utils/chain-cache.js";
import { formatUnits } from "viem";
import { watchChainlink } from "./price-watchers/chainlink.js";
import { watchBinance } from "./price-watchers/binance.js";

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

    if (contractWatcher.chain.id === mainnet.id) {
      // only watch FETCH on mainnet
      watchApproval(contractWatcher, storage);
      watchTransfer(contractWatcher, storage);
    }
  });

  const priceFeeds = await Promise.all([
    watchBinance(storage),
    watchChainlink(storage),
  ]);

  setInterval(() => {
    const timestamp = Math.round(Date.now() / 1000);
    Promise.all(priceFeeds.map((f) => f(timestamp))).catch(console.error);
  }, 1000); // update prices once per second
}

start().catch(console.error);
