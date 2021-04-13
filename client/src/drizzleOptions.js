import {Drizzle, generateStore} from '@drizzle/store';
import SimpleStorage from './contracts/SimpleStorage.json';
import Minter from './contracts/Minter.json';
import Coin from './contracts/Coin.json';

const drizzleOptions = {
    contracts: [
        SimpleStorage,
        Minter,
        Coin
    ],
    web3: {
        fallback: {
          type: "http",
          url: "http://127.0.0.1:8545",
        },
      },
      polls: {          
        blocks: 3000         
     },
    events: {
        SimpleStorage: ["StorageSet"],
        Minter: ["CoinCreated"],
    }
}

const drizzleStore = generateStore(drizzleOptions);
export const drizzleInstance = new Drizzle(drizzleOptions, drizzleStore);