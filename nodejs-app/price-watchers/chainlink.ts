import { ContractWatcher } from "../utils/contract-watcher.js";
import { getTimestamp } from "../event-watchers/eventHelpers.js";
import { Approval } from "../types/token/events.js";
import { FetchContract } from "../contracts/Fetch.js";
import { Storage } from "../types/storage.js";
import { formatUnits } from "viem";
import { publicClients } from "../utils/chain-cache.js";
import { mainnet } from "viem/chains";
import { ChainlinkPriceFeedContract } from "../contracts/ChainlinkPriceFeed.js";

export async function watchChainlink(
  storage: Storage
): Promise<(timestamp: number) => Promise<void>> {
  const publicClient = publicClients[mainnet.id];
  const feeds = ["btc/usd", "eth/usd"];
  const update = await Promise.all(
    feeds.map(async (feed) => {
      const address = await publicClient.getEnsAddress({
        name: `${feed.replace("/", "-")}.data.eth`,
      });
      if (!address) {
        console.warn(`Chainlink address for ${feed} not found.`);
        return () => {};
      }
      const decimals = await publicClient.readContract({
        abi: ChainlinkPriceFeedContract.abi,
        address: address,
        functionName: "decimals",
      });
      return async (timestamp: number) => {
        const [roundId, answer, startedAt, updatedAt, answeredInRound] =
          await publicClient.readContract({
            abi: ChainlinkPriceFeedContract.abi,
            address: address,
            functionName: "latestRoundData",
          });

        storage.query("INSERT INTO prices VALUES ($1, $2, $3, $4, $5)", [
          timestamp,
          feed,
          parseFloat(formatUnits(answer, decimals)),
          "chainlink",
          "dex",
        ]);
      };
    })
  );

  return async (timestamp: number) => {
    await Promise.all(update.map((f) => f(timestamp)));
  };
}
