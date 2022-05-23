import { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    getPhantomWallet,
    getSlopeWallet,
    getSolflareWallet,
    getSolflareWebWallet,
    getSolletWallet,
    getSolletExtensionWallet,
    getSolongWallet,
    getLedgerWallet,
    getSafePalWallet,
} from "@solana/wallet-adapter-wallets";

import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';

import "./App.css";
import {MintPage} from "./Home";

require('@solana/wallet-adapter-react-ui/styles.css');


const candyMachineId = new anchor.web3.PublicKey(
  process.env.REACT_APP_CANDY_MACHINE_ID!
);

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

const txTimeout = 30000; // milliseconds (confirm this works for your project)



const App = () => {
    // Custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), []);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            getPhantomWallet(),
            getSlopeWallet(),
            getSolflareWallet(),
            getSolflareWebWallet(),
            getSolletWallet({ network }),
            getSolletExtensionWallet({ network }),
            getSolongWallet(),
            getLedgerWallet(),
            getSafePalWallet(),
        ],
        []
    );

  return (

        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletModalProvider>
              <MintPage
                candyMachineId={candyMachineId}
                connection={connection}
                txTimeout={txTimeout}
                rpcHost={rpcHost}
              />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
  );
};

export default App;
