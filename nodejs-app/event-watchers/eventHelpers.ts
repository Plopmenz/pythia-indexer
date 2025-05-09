import { publicClients } from "../utils/chain-cache.js";

export async function getTimestamp(
  chainId: number,
  blockNumber: bigint
): Promise<bigint> {
  const publicClient = publicClients[chainId];
  const block = await publicClient.getBlock({ blockNumber: blockNumber });
  return block.timestamp;
}
