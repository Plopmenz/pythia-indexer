console.log("##### Pythia OracleFetcher: Top of oracleFetcher.ts #####"); // Forceful log
import { createPublicClient, http, formatUnits, Abi } from 'viem';
import { mainnet, bsc } from 'viem/chains';
import { Pool } from 'pg';
import { infuraApiKey, dbConnectionString } from '../utils/env.js';

// ABI for Chainlink AggregatorV3Interface
const AggregatorV3InterfaceABI: Abi = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {
        "internalType": "uint80",
        "name": "roundId",
        "type": "uint80"
      },
      {
        "internalType": "int256",
        "name": "answer",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "startedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "updatedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint80",
        "name": "answeredInRound",
        "type": "uint80"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ABI for Binance Oracle Feed Registry
const BinanceOracleFeedRegistryABI: Abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"address","name":"denomination","type":"address"},{"indexed":true,"internalType":"address","name":"latestAggregator","type":"address"},{"indexed":false,"internalType":"address","name":"previousAggregator","type":"address"},{"indexed":false,"internalType":"uint16","name":"nextPhaseId","type":"uint16"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"FeedConfirmed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":true,"internalType":"address","name":"denomination","type":"address"},{"indexed":true,"internalType":"address","name":"proposedAggregator","type":"address"},{"indexed":false,"internalType":"address","name":"currentAggregator","type":"address"},{"indexed":false,"internalType":"address","name":"sender","type":"address"}],"name":"FeedProposed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"accessController","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"PairAccessControllerSet","type":"event"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"address","name":"aggregator","type":"address"}],"name":"confirmFeed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"decimalsByName","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"descriptionByName","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"exists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAccessController","outputs":[{"internalType":"contract PairReadAccessControllerInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllPairs","outputs":[{"components":[{"internalType":"string","name":"baseAsset","type":"string"},{"internalType":"string","name":"quoteAsset","type":"string"}],"internalType":"struct EnumerableTradingPairMap.Pair[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getAnswer","outputs":[{"internalType":"int256","name":"answer","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"getCurrentPhaseId","outputs":[{"internalType":"uint16","name":"currentPhaseId","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"getFeed","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"aggregator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string[]","name":"bases","type":"string[]"},{"internalType":"string[]","name":"quotes","type":"string[]"}],"name":"getMultipleLatestRoundData","outputs":[{"components":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"internalType":"struct FeedRegistryInterface.RoundData[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint80","name":"roundId","type":"uint80"}],"name":"getNextRoundId","outputs":[{"internalType":"uint80","name":"nextRoundId","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint16","name":"phaseId","type":"uint16"}],"name":"getPhase","outputs":[{"components":[{"internalType":"uint16","name":"phaseId","type":"uint16"},{"internalType":"uint80","name":"startingAggregatorRoundId","type":"uint80"},{"internalType":"uint80","name":"endingAggregatorRoundId","type":"uint80"}],"internalType":"struct FeedRegistryInterface.Phase","name":"phase","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint16","name":"phaseId","type":"uint16"}],"name":"getPhaseFeed","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"aggregator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint16","name":"phaseId","type":"uint16"}],"name":"getPhaseRange","outputs":[{"internalType":"uint80","name":"startingRoundId","type":"uint80"},{"internalType":"uint80","name":"endingRoundId","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint80","name":"roundId","type":"uint80"}],"name":"getPreviousRoundId","outputs":[{"internalType":"uint80","name":"previousRoundId","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"getProposedFeed","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"proposedAggregator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint80","name":"roundId","type":"uint80"}],"name":"getRoundFeed","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"aggregator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint256","name":"roundId","type":"uint256"}],"name":"getTimestamp","outputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"getTradingPairDetails","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"},{"internalType":"address","name":"baseAssetAddress","type":"address"},{"internalType":"address","name":"quoteAssetAddress","type":"address"},{"internalType":"address","name":"feedAdapterAddress","type":"address"}],"name":"insertPair","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"aggregator","type":"address"}],"name":"isFeedEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"answer","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"latestAnswerByName","outputs":[{"internalType":"int256","name":"answer","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"latestRound","outputs":[{"internalType":"uint256","name":"roundId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"latestRoundDataByName","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"latestTimestamp","outputs":[{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"address","name":"aggregator","type":"address"}],"name":"proposeFeed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"},{"internalType":"uint80","name":"roundId","type":"uint80"}],"name":"proposedGetRoundData","outputs":[{"internalType":"uint80","name":"id","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"proposedLatestRoundData","outputs":[{"internalType":"uint80","name":"id","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"removePair","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract PairReadAccessControllerInterface","name":"_accessController","type":"address"}],"name":"setAccessController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalPairsAvailable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"typeAndVersion","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"base","type":"address"},{"internalType":"address","name":"quote","type":"address"}],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"base","type":"string"},{"internalType":"string","name":"quote","type":"string"}],"name":"versionByName","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}] as const;

type RpcConfig = 
    | { type: 'infura'; network: 'mainnet' | 'bsc' }
    | { type: 'env_var'; envVarName: string };

interface OracleFeedConfig {
    name: string;
    oracleType: 'chainlink' | 'binance_oracle';
    rpcConfig: RpcConfig; 
    chain: typeof mainnet | typeof bsc;
    contractAddress: `0x${string}`;
    abi: Abi;
    assetPair: string; // e.g., ETH/USD - used for logging and DB storage
    baseAssetName?: string; // For Binance Oracle, e.g., "ETH"
    quoteAssetName?: string; // For Binance Oracle, e.g., "USD"
    decimalsFunction?: string; // For Chainlink 'decimals', Binance 'decimalsByName'
    dataFunction?: string; // For Chainlink 'latestRoundData', Binance 'latestRoundDataByName'
}

const feedsToWatch: OracleFeedConfig[] = [
    {
        name: 'Chainlink ETH/USD (Mainnet)',
        oracleType: 'chainlink',
        rpcConfig: { type: 'infura', network: 'mainnet' },
        chain: mainnet,
        contractAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
        abi: AggregatorV3InterfaceABI,
        assetPair: 'ETH/USD',
        dataFunction: 'latestRoundData',
        decimalsFunction: 'decimals',
    },
    {
        name: 'Binance Oracle ETH/USD (BSC)',
        oracleType: 'binance_oracle',
        rpcConfig: { type: 'infura', network: 'bsc' },
        chain: bsc,
        contractAddress: '0x55328A2dF78C5E379a3FeE693F47E6d4279C2193', // Feed Registry Address
        abi: BinanceOracleFeedRegistryABI, 
        assetPair: 'ETH/USD',
        baseAssetName: 'ETH',
        quoteAssetName: 'USD',
        dataFunction: 'latestRoundDataByName',
        decimalsFunction: 'decimalsByName',
    },
];

const POLLING_INTERVAL_MS = 60 * 1000;

let pgPool: Pool;

function getPgPool(): Pool {
    if (!pgPool) {
        const dbConnString = dbConnectionString();
        pgPool = new Pool({ connectionString: dbConnString });
    }
    return pgPool;
}

// Define a type for the expected structure of round data from both oracles
type OracleRoundData = {
    roundId: bigint;
    answer: bigint;
    startedAt: bigint;
    updatedAt: bigint;
    answeredInRound: bigint;
};

async function fetchAndStoreOraclePrice(feedConfig: OracleFeedConfig) {
    let rpcUrlToUse: string | undefined;
    const key = infuraApiKey(); 

    if (feedConfig.rpcConfig.type === 'infura') {
        if (!key) {
            console.error(`[${feedConfig.name}] INFURA_API_KEY is required when rpcConfig type is "infura", but key is not set. Skipping.`);
            return;
        }
        if (feedConfig.rpcConfig.network === 'mainnet') {
            rpcUrlToUse = `https://mainnet.infura.io/v3/${key}`;
        } else if (feedConfig.rpcConfig.network === 'bsc') {
            rpcUrlToUse = `https://bsc-mainnet.infura.io/v3/${key}`;
        } else {
            console.error(`[${feedConfig.name}] Unknown Infura network specified in rpcConfig: ${(feedConfig.rpcConfig as any).network}. Skipping.`);
            return;
        }
    } else if (feedConfig.rpcConfig.type === 'env_var') {
        rpcUrlToUse = process.env[feedConfig.rpcConfig.envVarName];
        if (!rpcUrlToUse) {
            console.error(`[${feedConfig.name}] RPC URL environment variable "${feedConfig.rpcConfig.envVarName}" not set. Skipping.`);
            return;
        }
    } else {
        console.error(`[${feedConfig.name}] Invalid rpcConfig type. Skipping.`);
        return;
    }
    
    // This check becomes redundant if the above logic handles undefined rpcUrlToUse correctly.
    // However, keeping it for safety, or it can be removed if confident.
    if (!rpcUrlToUse) { 
        console.error(`[${feedConfig.name}] RPC URL could not be determined. Skipping.`);
        return;
    }
    console.log(`[${feedConfig.name}] Using RPC URL: ${rpcUrlToUse}`); 

    if (feedConfig.oracleType === 'binance_oracle' && (!feedConfig.abi || feedConfig.abi.length === 0)) {
        console.warn(`[${feedConfig.name}] ABI for Binance Oracle Registry is not defined or empty. Skipping.`);
        return;
    }

    const client = createPublicClient({
        chain: feedConfig.chain,
        transport: http(rpcUrlToUse),
    });

    const pool = getPgPool();

    try {
        let price: number | null = null;
        let decimals: number | undefined;
        let roundId: bigint | null = null;
        let observedTimestamp: Date | null = null;
        let startedAtTimestamp: Date | null = null;
        let answeredInRound: bigint | null = null;

        let rawDataFromContract: OracleRoundData | any; // To store raw result

        if (feedConfig.oracleType === 'chainlink') {
            if (!feedConfig.decimalsFunction || !feedConfig.dataFunction) {
                console.error(`[${feedConfig.name}] Chainlink feed is missing decimalsFunction or dataFunction. Skipping.`);
                return;
            }
            try {
                console.log(`[${feedConfig.name}] Fetching decimals...`);
                const decResult = await client.readContract({
                    address: feedConfig.contractAddress,
                    abi: feedConfig.abi,
                    functionName: feedConfig.decimalsFunction,
                });
                decimals = Number(decResult);
                console.log(`[${feedConfig.name}] Decimals received: ${decimals}`);

                console.log(`[${feedConfig.name}] Fetching latestRoundData...`);
                rawDataFromContract = await client.readContract({
                    address: feedConfig.contractAddress,
                    abi: feedConfig.abi,
                    functionName: feedConfig.dataFunction,
                });
                console.log(`[${feedConfig.name}] Raw data from latestRoundData:`, JSON.stringify(rawDataFromContract, (key, value) => typeof value === 'bigint' ? value.toString() : value));

            } catch (contractCallError) {
                console.error(`[${feedConfig.name}] Error during Chainlink contract call:`, contractCallError);
                return;
            }
            
            const data = rawDataFromContract as any[]; // Treat as an array
            if (typeof decimals !== 'number') {
                console.error(`[${feedConfig.name}] Decimals not found or not a number after contract call. Cannot process price.`);
                return;
            }
            
            if (!Array.isArray(data) || data.length < 5) {
                console.error(`[${feedConfig.name}] latestRoundData did not return a valid array with at least 5 elements. Received:`, JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
                return;
            }

            // Access by index based on ABI output order
            // roundId, answer, startedAt, updatedAt, answeredInRound
            const roundIdFromData = data[0] as bigint;
            const answerFromData = data[1] as bigint;
            const startedAtFromData = data[2] as bigint;
            const updatedAtFromData = data[3] as bigint;
            const answeredInRoundFromData = data[4] as bigint;

            // If answerFromData is somehow still not a bigint, formatUnits will throw, which is fine.
            price = parseFloat(formatUnits(answerFromData, decimals));
            roundId = roundIdFromData;
            observedTimestamp = new Date(Number(updatedAtFromData) * 1000);
            startedAtTimestamp = new Date(Number(startedAtFromData) * 1000);
            answeredInRound = answeredInRoundFromData;

        } else if (feedConfig.oracleType === 'binance_oracle') {
            if (!feedConfig.decimalsFunction || !feedConfig.dataFunction || !feedConfig.baseAssetName || !feedConfig.quoteAssetName) {
                console.error(`[${feedConfig.name}] Binance Oracle feed is missing decimalsFunction, dataFunction, baseAssetName, or quoteAssetName. Skipping.`);
                return;
            }
            try {
                console.log(`[${feedConfig.name}] Fetching decimals for ${feedConfig.baseAssetName}/${feedConfig.quoteAssetName}...`);
                const decResult = await client.readContract({
                    address: feedConfig.contractAddress,
                    abi: feedConfig.abi,
                    functionName: feedConfig.decimalsFunction,
                    args: [feedConfig.baseAssetName, feedConfig.quoteAssetName],
                });
                decimals = Number(decResult);
                console.log(`[${feedConfig.name}] Decimals received: ${decimals}`);

                console.log(`[${feedConfig.name}] Fetching latestRoundDataByName for ${feedConfig.baseAssetName}/${feedConfig.quoteAssetName}...`);
                rawDataFromContract = await client.readContract({
                    address: feedConfig.contractAddress,
                    abi: feedConfig.abi,
                    functionName: feedConfig.dataFunction,
                    args: [feedConfig.baseAssetName, feedConfig.quoteAssetName],
                });
                console.log(`[${feedConfig.name}] Raw data from latestRoundDataByName:`, JSON.stringify(rawDataFromContract, (key, value) => typeof value === 'bigint' ? value.toString() : value));

            } catch (contractCallError) {
                console.error(`[${feedConfig.name}] Error during Binance Oracle contract call:`, contractCallError);
                return;
            }

            const data = rawDataFromContract as any[]; // Treat as an array
            if (typeof decimals !== 'number') {
                console.error(`[${feedConfig.name}] Decimals not found or not a number after contract call. Cannot process price.`);
                return;
            }

            if (!Array.isArray(data) || data.length < 5) {
                console.error(`[${feedConfig.name}] latestRoundDataByName did not return a valid array with at least 5 elements. Received:`, JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
                return;
            }

            // Access by index based on ABI output order for latestRoundDataByName
            // roundId, answer, startedAt, updatedAt, answeredInRound
            const roundIdFromData = data[0] as bigint;
            const answerFromData = data[1] as bigint;
            const startedAtFromData = data[2] as bigint;
            const updatedAtFromData = data[3] as bigint;
            const answeredInRoundFromData = data[4] as bigint;
            
            // If answerFromData is somehow still not a bigint, formatUnits will throw.
            price = parseFloat(formatUnits(answerFromData, decimals));
            roundId = roundIdFromData;
            observedTimestamp = new Date(Number(updatedAtFromData) * 1000);
            startedAtTimestamp = new Date(Number(startedAtFromData) * 1000);
            answeredInRound = answeredInRoundFromData;
        }

        if (price !== null && observedTimestamp !== null && typeof decimals === 'number') {
            console.log(`Fetched ${feedConfig.name}: ${price} ${feedConfig.assetPair} at ${observedTimestamp.toISOString()}, Round: ${roundId ?? 'N/A'}`);
            
            let conflictTargetConstraint = '';
            // Both Chainlink and Binance (via latestRoundDataByName) provide roundId, 
            // so unique_chainlink_feed_round can be used if we ensure feed_contract_address + round_id is unique.
            // However, Binance Oracle's primary unique identifier per feed for a timestamp might be more robust
            // if round IDs are not guaranteed to be unique across different *pairs* within the *same* registry contract.
            // Let's stick to distinct constraints for now for clarity.
            if (feedConfig.oracleType === 'chainlink') {
                conflictTargetConstraint = 'uq_chainlink_oracle_name_contract_round';
            } else if (feedConfig.oracleType === 'binance_oracle') {
                // For Binance, since we're using the registry, feed_contract_address is the registry.
                // Uniqueness should be on registry_address + asset_pair + observed_timestamp or registry_address + asset_pair + roundId.
                // The existing 'unique_binance_oracle_feed_timestamp' is (feed_contract_address, observed_timestamp).
                // This might be okay if observed_timestamp is granular enough.
                // If we want to use round_id, we'd need a constraint like (feed_contract_address, asset_pair, round_id).
                // Let's use the timestamp one as it's simpler and already defined.
                conflictTargetConstraint = 'uq_binance_oracle_name_contract_asset_timestamp';
            }

            if (!conflictTargetConstraint) {
                console.error(`No conflict target constraint defined for oracle type: ${feedConfig.oracleType} for ${feedConfig.name}. Skipping insert.`);
                return;
            }

            // For Binance Oracle, roundId, startedAtTimestamp, and answeredInRound are now directly available
            // from latestRoundDataByName, similar to Chainlink. So direct assignment is fine.
            let dbRoundId = roundId;
            const dbStartedAtTimestamp = startedAtTimestamp;
            let dbAnsweredInRound = answeredInRound;

            // SPECIAL HANDLING FOR BINANCE ORACLE'S APPARENT DEFAULT/MAX ROUND ID
            const binanceProblematicRoundId = 18446744073709551616n;
            if (feedConfig.oracleType === 'binance_oracle' && roundId === binanceProblematicRoundId) {
                console.log(`[${feedConfig.name}] Detected problematic round_id (${roundId}). Setting round_id and answered_in_round to NULL for DB insert.`);
                dbRoundId = null;
                dbAnsweredInRound = null;
            }

            // DIAGNOSTIC LOG:
            console.log(`[${feedConfig.name}] PRE-QUERY CHECK: oracleType='${feedConfig.oracleType}', conflictTargetConstraint='${conflictTargetConstraint}', dbRoundId='${dbRoundId}'`);

            if (feedConfig.oracleType === 'chainlink') {
                const chainlinkQuery = `
                    INSERT INTO oracle_price_feeds 
                        (oracle_name, asset_pair, price, decimals, round_id, observed_timestamp, chain_id, feed_contract_address, started_at_timestamp, answered_in_round) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (oracle_name, feed_contract_address, round_id) DO NOTHING
                `;
                await pool.query(
                    chainlinkQuery,
                    [
                        feedConfig.name,
                        feedConfig.assetPair,
                        price,
                        decimals,
                        dbRoundId, 
                        observedTimestamp,
                        feedConfig.chain.id,
                        feedConfig.contractAddress,
                        dbStartedAtTimestamp,
                        dbAnsweredInRound,
                    ]
                );
            } else if (feedConfig.oracleType === 'binance_oracle') {
                console.log(`[${feedConfig.name}] DIAGNOSTIC: Using column-based ON CONFLICT target.`);
                const binanceQuery = `
                    INSERT INTO oracle_price_feeds 
                        (oracle_name, asset_pair, price, decimals, round_id, observed_timestamp, chain_id, feed_contract_address, started_at_timestamp, answered_in_round) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (oracle_name, feed_contract_address, asset_pair, observed_timestamp) DO NOTHING
                `;
                await pool.query(
                    binanceQuery,
                    [
                        feedConfig.name,
                        feedConfig.assetPair,
                        price,
                        decimals,
                        dbRoundId, 
                        observedTimestamp,
                        feedConfig.chain.id,
                        feedConfig.contractAddress,
                        dbStartedAtTimestamp,
                        dbAnsweredInRound,
                    ]
                );
            } else {
                console.error(`[${feedConfig.name}] Unknown oracleType for query construction. Skipping insert.`);
            }
        } else {
            console.log(`Could not retrieve valid price, decimals, or timestamp for ${feedConfig.name}`);
        }

    } catch (error) {
        console.error(`Error fetching price for ${feedConfig.name}:`, error);
    }
}

export async function startOracleWatchers() {
    console.log("##### Pythia OracleFetcher: startOracleWatchers() function entered #####"); // Forceful log
    getPgPool(); // Initialize pool early
    for (const feed of feedsToWatch) {
        fetchAndStoreOraclePrice(feed).catch(e => console.error(`Initial fetch for ${feed.name} failed:`, e)); 
        setInterval(() => {
            fetchAndStoreOraclePrice(feed).catch(e => console.error(`Scheduled fetch for ${feed.name} failed:`, e));
        }, POLLING_INTERVAL_MS);
    }
}