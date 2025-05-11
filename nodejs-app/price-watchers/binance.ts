import { Storage } from "../types/storage.js";

export async function watchBinance(
  storage: Storage
): Promise<(timestamp: number) => Promise<void>> {
  const baseUrl = "https://data-api.binance.vision";
  const feeds = ["btc/usd", "eth/usd"];
  const update = await Promise.all(
    feeds.map(async (feed) => {
      return async (timestamp: number) => {
        const { mins, price, closeTime } = await fetch(
          `${baseUrl}/api/v3/avgPrice?symbol=${feed
            .replace("usd", "usdt")
            .replace("/", "")
            .toUpperCase()}`
        ).then(
          (res) =>
            res.json() as Promise<{
              mins: number;
              price: string;
              closeTime: number;
            }>
        );

        storage.query("INSERT INTO prices VALUES ($1, $2, $3, $4, $5)", [
          timestamp,
          feed,
          parseFloat(price),
          "binance",
          "cex",
        ]);
      };
    })
  );

  return async (timestamp: number) => {
    await Promise.all(update.map((f) => f(timestamp)));
  };
}
