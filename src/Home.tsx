import {useCallback, useEffect, useMemo, useState} from "react";
import Countdown from "react-countdown";
import {Snackbar, Alert, Paper, Grid, useTheme, Container, Typography} from "@mui/material";

import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";

import {
    Commitment,
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import {useWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {GatewayProvider} from '@civic/solana-gateway-react';

import {AlertState, getAtaForMint, toDate} from './utils';
import {
    awaitTransactionSignatureConfirmation,
    CANDY_MACHINE_PROGRAM,
    CandyMachineAccount,
    createAccountsForMint,
    getCandyMachineState,
    getCollectionPDA,
    mintOneToken,
    SetupState,
} from "./candy-machine";



import nft_image from "./img/nft_image.gif"


import Info from "./components/Info";
import CountDown from "./components/Countdown";
import InactiveMintButton from "./components/InactiveMintButton";
import ProgressBar from "./components/ProgressBar";
import MintButton from './components/MintButton';

import './Home.css'
import {MainContainer,
    ConnectButton,
    FullWidthConnectButton,
    Wallet,
    WalletAmount,
    WalletContainer,
} from "./components/styled";

import isMobile from "./components/isMobile"
import {startDate, startWlDate, mintPrice, supply} from "./constants";


const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";


export interface HomeProps {
    candyMachineId?: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
    network: WalletAdapterNetwork;
}

export const MintPage = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
    const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [payWithSplToken, setPayWithSplToken] = useState(false);
    const [price, setPrice] = useState(0);
    const [priceLabel, setPriceLabel] = useState<string>("SOL");
    const [whitelistPrice, setWhitelistPrice] = useState(0);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [isBurnToken, setIsBurnToken] = useState(false);
    const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
    const [isEnded, setIsEnded] = useState(false);
    const [endDate, setEndDate] = useState<Date>();
    const [isPresale, setIsPresale] = useState(false);
    const [isWLOnly, setIsWLOnly] = useState(false);
    const [refreshFlag, setRefreshFlag] = useState(false)

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const [needTxnSplit, setNeedTxnSplit] = useState(true);
    const [setupTxn, setSetupTxn] = useState<SetupState>();

    const wallet = useWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();

    const rpcUrl = props.rpcHost;
    const solFeesEstimation = 0.012; // approx of account creation fees

    const anchorWallet = useMemo(() => {
        if (
            !wallet ||
            !wallet.publicKey ||
            !wallet.signAllTransactions ||
            !wallet.signTransaction
        ) {
            return;
        }

        return {
            publicKey: wallet.publicKey,
            signAllTransactions: wallet.signAllTransactions,
            signTransaction: wallet.signTransaction,
        } as anchor.Wallet;
    }, [wallet]);

    const refreshCandyMachineState = useCallback(
        async (commitment: Commitment = 'confirmed') => {
            if (!anchorWallet) {
                return;
            }

            const connection = new Connection(props.rpcHost, commitment);

            if (props.candyMachineId) {
                try {
                    const cndy = await getCandyMachineState(
                        anchorWallet,
                        props.candyMachineId,
                        connection,
                    );

                    setCandyMachine(cndy);
                    setItemsAvailable(cndy.state.itemsAvailable);
                    setItemsRemaining(cndy.state.itemsRemaining);
                    let tempItems = itemsRedeemed
                    setItemsRedeemed(cndy.state.itemsRedeemed >= tempItems ? cndy.state.itemsRedeemed : tempItems);
                   

                    var divider = 1;
                    if (decimals) {
                        divider = +('1' + new Array(decimals).join('0').slice() + '0');
                    }

                    // detect if using spl-token to mint
                    if (cndy.state.tokenMint) {
                        setPayWithSplToken(true);
                        // Customize your SPL-TOKEN Label HERE
                        // TODO: get spl-token metadata name
                        setPriceLabel(splTokenName);
                        setPrice(cndy.state.price.toNumber() / divider);
                        setWhitelistPrice(cndy.state.price.toNumber() / divider);
                    } else {
                        setPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
                        setWhitelistPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
                    }


                    // fetch whitelist token balance
                    if (cndy.state.whitelistMintSettings) {
                        setWhitelistEnabled(true);
                        setIsBurnToken(cndy.state.whitelistMintSettings.mode.burnEveryTime);
                        setIsPresale(cndy.state.whitelistMintSettings.presale);
                        setIsWLOnly(!isPresale && cndy.state.whitelistMintSettings.discountPrice === null);

                        if (cndy.state.whitelistMintSettings.discountPrice !== null && cndy.state.whitelistMintSettings.discountPrice !== cndy.state.price) {
                            if (cndy.state.tokenMint) {
                                setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / divider);
                            } else {
                                setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / LAMPORTS_PER_SOL);
                            }
                        }

                        let balance = 0;
                        try {
                            const tokenBalance =
                                await props.connection.getTokenAccountBalance(
                                    (
                                        await getAtaForMint(
                                            cndy.state.whitelistMintSettings.mint,
                                            anchorWallet.publicKey,
                                        )
                                    )[0],
                                );

                            balance = tokenBalance?.value?.uiAmount || 0;
                        } catch (e) {
                            console.error(e);
                            balance = 0;
                        }
                        if (commitment !== "processed") {
                            setWhitelistTokenBalance(balance);
                        }
                        setIsActive(isPresale && !isEnded && balance > 0);

                    } else {
                        setWhitelistEnabled(false);
                    }

                    // end the mint when date is reached
                    if (cndy?.state.endSettings?.endSettingType.date) {
                        setEndDate(toDate(cndy.state.endSettings.number));
                        if (
                            cndy.state.endSettings.number.toNumber() <
                            new Date().getTime() / 1000
                        ) {
                            setIsEnded(true);
                            setIsActive(false);
                        }
                    }
                    // end the mint when amount is reached
                    if (cndy?.state.endSettings?.endSettingType.amount) {
                        let limit = Math.min(
                            cndy.state.endSettings.number.toNumber(),
                            cndy.state.itemsAvailable,
                        );
                        setItemsAvailable(limit);
                        if (cndy.state.itemsRedeemed < limit) {
                            setItemsRemaining(limit - cndy.state.itemsRedeemed);
                        } else {
                            setItemsRemaining(0);
                            cndy.state.isSoldOut = true;
                            setIsEnded(true);
                        }
                    } else {
                        setItemsRemaining(cndy.state.itemsRemaining);
                    }

                    if (cndy.state.isSoldOut) {
                        setIsActive(false);
                    }

                    const [collectionPDA] = await getCollectionPDA(props.candyMachineId);
                    const collectionPDAAccount = await connection.getAccountInfo(
                        collectionPDA,
                    );

                    const txnEstimate =
                        892 +
                        (!!collectionPDAAccount && cndy.state.retainAuthority ? 182 : 0) +
                        (cndy.state.tokenMint ? 66 : 0) +
                        (cndy.state.whitelistMintSettings ? 34 : 0) +
                        (cndy.state.whitelistMintSettings?.mode?.burnEveryTime ? 34 : 0) +
                        (cndy.state.gatekeeper ? 33 : 0) +
                        (cndy.state.gatekeeper?.expireOnUse ? 66 : 0);

                    setNeedTxnSplit(txnEstimate > 1230);
                } catch (e) {
                    if (e instanceof Error) {
                        if (
                            e.message === `Account does not exist ${props.candyMachineId}`
                        ) {
                            setAlertState({
                                open: true,
                                message: `Couldn't fetch candy machine state from candy machine with address: ${props.candyMachineId}, using rpc: ${props.rpcHost}! You probably typed the REACT_APP_CANDY_MACHINE_ID value in wrong in your .env file, or you are using the wrong RPC!`,
                                severity: 'error',
                                hideDuration: null,
                            });
                        } else if (
                            e.message.startsWith('failed to get info about account')
                        ) {
                            setAlertState({
                                open: true,
                                message: `Couldn't fetch candy machine state with rpc: ${props.rpcHost}! This probably means you have an issue with the REACT_APP_SOLANA_RPC_HOST value in your .env file, or you are not using a custom RPC!`,
                                severity: 'error',
                                hideDuration: null,
                            });
                        }
                    } else {
                        setAlertState({
                            open: true,
                            message: `${e}`,
                            severity: 'error',
                            hideDuration: null,
                        });
                    }
                    console.log(e);
                }
            } else {
                setAlertState({
                    open: true,
                    message: `Your REACT_APP_CANDY_MACHINE_ID value in the .env file doesn't look right! Make sure you enter it in as plain base-58 address!`,
                    severity: 'error',
                    hideDuration: null,
                });
            }
        },
        [anchorWallet, props.candyMachineId, props.rpcHost, isEnded, isPresale, props.connection],
    );


    function displaySuccess(mintPublicKey: any, qty: number = 1): void {
        let remaining = itemsRemaining - qty;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - qty;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setSetupTxn(undefined);
        setItemsRedeemed(itemsRedeemed + qty);
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - ((whitelistEnabled ? whitelistPrice : price) * qty) - solFeesEstimation);
        }
        setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
            ? ("https://solscan.io/token/" + mintPublicKey + "?cluster=" + cluster)
            : ("https://solscan.io/token/" + mintPublicKey));
        setIsMinting(false);
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: {y: 0.6},
        });
    }

    const onMint = async (
        beforeTransactions: Transaction[] = [],
        afterTransactions: Transaction[] = [],
    ) => {
        try {
            if (wallet.connected && candyMachine?.program && wallet.publicKey) {
                setIsMinting(true);
                let setupMint: SetupState | undefined;
                if (needTxnSplit && setupTxn === undefined) {
                    setAlertState({
                        open: true,
                        message: 'Please validate account setup transaction',
                        severity: 'info',
                    });
                    setupMint = await createAccountsForMint(
                        candyMachine,
                        wallet.publicKey,
                    );
                    let status: any = {err: true};
                    if (setupMint.transaction) {
                        status = await awaitTransactionSignatureConfirmation(
                            setupMint.transaction,
                            props.txTimeout,
                            props.connection,
                            true,
                        );
                    }
                    if (status && !status.err) {
                        setSetupTxn(setupMint);
                        setAlertState({
                            open: true,
                            message:
                                'Setup transaction succeeded! You can now validate mint transaction',
                            severity: 'info',
                        });
                    } else {
                        setAlertState({
                            open: true,
                            message: 'Mint failed! Please try again!',
                            severity: 'error',
                        });
                        return;
                    }
                }

                const setupState = setupMint ?? setupTxn;
                const mint = setupState?.mint ?? anchor.web3.Keypair.generate();
                let mintResult = await mintOneToken(
                    candyMachine,
                    wallet.publicKey,
                    mint,
                    beforeTransactions,
                    afterTransactions,
                    setupState,
                );

                let status: any = {err: true};
                let metadataStatus = null;
                if (mintResult) {
                    status = await awaitTransactionSignatureConfirmation(
                        mintResult.mintTxId,
                        props.txTimeout,
                        props.connection,
                        true,
                    );

                    metadataStatus =
                        await candyMachine.program.provider.connection.getAccountInfo(
                            mintResult.metadataKey,
                            'processed',
                        );
                    console.log('Metadata status: ', !!metadataStatus);
                }

                if (status && !status.err && metadataStatus) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Mint succeeded!',
                        severity: 'success',
                    });

                    // update front-end amounts
                    displaySuccess(mint.publicKey);
                    refreshCandyMachineState('processed');
                } else if (status && !status.err) {
                    setAlertState({
                        open: true,
                        message:
                            'Mint likely failed! Anti-bot SOL 0.01 fee potentially charged! Check the explorer to confirm the mint failed and if so, make sure you are eligible to mint before trying again.',
                        severity: 'error',
                        hideDuration: 8000,
                    });
                    refreshCandyMachineState();
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                    refreshCandyMachineState();
                }
            }
        } catch (error: any) {
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (!error.message) {
                    message = 'Transaction Timeout! Please try again.';
                } else if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setIsMinting(false);
        }
    };

    useEffect(() => {
        (async () => {
            if (anchorWallet) {
                const balance = await props.connection.getBalance(anchorWallet!.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [anchorWallet, props.connection]);

    useEffect(() => {
        refreshCandyMachineState();
    }, [
        anchorWallet,
        props.candyMachineId,
        props.connection,
        isEnded,
        isPresale,
        refreshCandyMachineState,
        refreshFlag
    ]);

    useEffect(
        () => {
            let timer1 = setInterval(() => setRefreshFlag(!refreshFlag), 5000);
            return () => {
                clearInterval(timer1);
            };
        },
        [refreshFlag]
    );


    const mobileMarker = isMobile()
    const theme = useTheme()

    const renderGoLiveDateCounter = ({days, hours, minutes, seconds}: any) => {
        return <CountDown days={days} hours={hours} minutes={minutes} seconds={seconds}/>
    };




    return (
        <main style={{
            backgroundColor: theme.palette.primary.dark,
            width: window.innerWidth > 530 ? '100%' : window.innerWidth * 0.99,
            overflowX: 'hidden',
            height: '100%',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <MainContainer style={{
                marginTop: 50,
            }}>


                <WalletContainer>
                    <Wallet>
                        {
                           wallet ?
                                   <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton/></WalletAmount> :
                                   <ConnectButton>Connect Wallet</ConnectButton>
                        }

                    </Wallet>
                </WalletContainer>




                {wallet && isActive && whitelistEnabled && (whitelistTokenBalance > 0) &&
                <Typography variant={mobileMarker ? "h4" : 'h3'} style={{
                    color: '#fff',
                    fontFamily: 'Main',
                    fontWeight: 'bold',
                    marginBottom: 10
                }}>You are whitelisted!</Typography>}

                <Container maxWidth="md">
                    <Paper style={{
                        paddingTop: '1rem',
                        paddingLeft: '1rem',
                        paddingRight: 0,
                        paddingBottom: '1rem',
                        backgroundColor: theme.palette.primary.main,
                        width: '90%',
                        marginLeft: mobileMarker ? '2.5%' : '5%',
                        minHeight: mobileMarker ? window.innerHeight * 0.75 : 'auto'
                    }}>
                        <Grid container spacing={2} style={{
                            width: '100%',

                        }}>
                            <Grid item xs={12} md={6} sm={6} lg={6}>
                                <img src={nft_image} alt="loading..."
                                     style={{width: '100%', borderRadius: 10,
                                         boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px"}}/>
                            </Grid>

                            <Grid item xs={12} md={6} sm={6} lg={6} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                paddingBottom: mobileMarker ? 0 : '0.3rem',
                                height: mobileMarker ? '100%' : 'auto'
                            }}>
                                <Typography variant="h4" style={{
                                    color: '#fff',
                                    fontFamily: 'Main',
                                    fontWeight: 'bold',
                                }}>
                                    CollectiveBuying.io
                                </Typography>

                                        <Info type="price" amount={price ? isActive && whitelistEnabled && (whitelistTokenBalance > 0) ? (whitelistPrice + " " + priceLabel) : (price + " " + priceLabel) : mintPrice}/>
                                <Info type="Supply" amount={itemsAvailable ? itemsAvailable : supply}/>

                                        {wallet && isActive &&
                                        (whitelistEnabled && (whitelistTokenBalance > 0) ? new Date() > startWlDate : new Date() > startDate) ?
                                            <ProgressBar available={itemsAvailable} redeemed={itemsRedeemed} /> : <Countdown
                                            date={ whitelistEnabled && (whitelistTokenBalance > 0) ? startWlDate : startDate}
                                            onMount={({completed}) => completed && setIsActive(!isEnded)}
                                            onComplete={() => {
                                                setIsActive(!isEnded);
                                            }}
                                            renderer={renderGoLiveDateCounter}
                                        />
                                        }

                                            {!isActive && !isEnded && candyMachine?.state.goLiveDate && (!isWLOnly || whitelistTokenBalance > 0) || (whitelistEnabled && (whitelistTokenBalance > 0) ? new Date() < startWlDate : new Date() < startDate) ? <InactiveMintButton /> : (
                                                !wallet ? (
                                                    <FullWidthConnectButton>Connect Wallet</FullWidthConnectButton>
                                                ) : (!isWLOnly || whitelistTokenBalance > 0) ?
                                                    candyMachine?.state.gatekeeper &&
                                                    wallet.publicKey &&
                                                    wallet.signTransaction ? (
                                                        <GatewayProvider
                                                            wallet={{
                                                                publicKey:
                                                                    wallet.publicKey ||
                                                                    new PublicKey(CANDY_MACHINE_PROGRAM),
                                                                //@ts-ignore
                                                                signTransaction: wallet.signTransaction,
                                                            }}
                                                            clusterUrl={rpcUrl}
                                                            options={{autoShowModal: false}}
                                                        >
                                                            <MintButton
                                                                candyMachine={candyMachine}
                                                                isMinting={isMinting}
                                                                isActive={isActive}
                                                                isEnded={isEnded}
                                                                isSoldOut={isSoldOut}
                                                                onMint={onMint}
                                                            />
                                                        </GatewayProvider>
                                                    ) : (
                                                        <MintButton
                                                            candyMachine={candyMachine}
                                                            isMinting={isMinting}
                                                            isActive={isActive}
                                                            isEnded={isEnded}
                                                            isSoldOut={isSoldOut}
                                                            onMint={onMint}
                                                        />
                                                    ) :
                                                    <h1>Mint is private.</h1>
                                            )}

                                </Grid>
                            </Grid>
                    </Paper>
                </Container>

            </MainContainer>

            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({...alertState, open: false})}
            >
                <Alert
                    onClose={() => setAlertState({...alertState, open: false})}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
        </main>
    );
};


