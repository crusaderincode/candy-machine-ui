import React, {useEffect, useState} from "react";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {GatewayProvider} from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import {Snackbar, Alert, Paper, Grid, useTheme, Container, Typography} from "@mui/material";
import {toDate, AlertState, getAtaForMint} from './utils';
import MintButton from './components/MintButton';
import './Home.css'
import {MainContainer,
    ConnectButton,
    FullWidthConnectButton,
    Wallet,
    WalletAmount,
    WalletContainer,
} from "./components/styled";
import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    CANDY_MACHINE_PROGRAM,
} from "./candy-machine";

import nft_image from "./img/nft_image.gif"


import Info from "./components/Info";
import CountDown from "./components/Countdown";
import InactiveMintButton from "./components/InactiveMintButton";
import ProgressBar from "./components/ProgressBar";

import isMobile from "./components/isMobile"
import {startDate, startWlDate, mintPrice, supply} from "./constants";


const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";

export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
}

export const MintPage = (props: HomeProps) => {
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
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

    const mobileMarker = isMobile()
    const theme = useTheme()

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();

    const rpcUrl = props.rpcHost;

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const cndy = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                props.connection
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
            }else {
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
                                    wallet.publicKey,
                                )
                            )[0],
                        );

                    balance = tokenBalance?.value?.uiAmount || 0;
                } catch (e) {
                    console.error(e);
                    balance = 0;
                }
                setWhitelistTokenBalance(balance);
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
        })();
    };

    const renderGoLiveDateCounter = ({days, hours, minutes, seconds}: any) => {
        return <CountDown days={days} hours={hours} minutes={minutes} seconds={seconds}/>
    };


    function displaySuccess(): void {
        let remaining = itemsRemaining - 1;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - 1;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setItemsRedeemed(itemsRedeemed + 1);
        const solFeesEstimation = 0.012; // approx
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - (whitelistEnabled ? whitelistPrice : price) - solFeesEstimation);
        }
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: {y: 0.6},
        });
    }

    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program && wallet.publicKey) {
                const mint = anchor.web3.Keypair.generate();
                const mintTxId = (
                    await mintOneToken(candyMachine, wallet.publicKey, mint)
                )[0];

                let status: any = {err: true};
                if (mintTxId) {
                    status = await awaitTransactionSignatureConfirmation(
                        mintTxId,
                        props.txTimeout,
                        props.connection,
                        'singleGossip',
                        true,
                    );
                }

                if (!status?.err) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Mint succeeded!',
                        severity: 'success',
                    });

                    // update front-end amounts
                    displaySuccess();
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                }
            }
        } catch (error: any) {
            // TODO: blech:
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
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    useEffect(refreshCandyMachineState, [
        wallet,
        props.candyMachineId,
        props.connection,
        isEnded,
        isPresale,
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




    return (
        <main style={{
            backgroundColor: theme.palette.primary.dark,
            width: window.innerWidth > 530 ? '100%' : window.innerWidth * 0.99,
            overflowX: 'hidden',
            height: '100%',
            minHeight: '100vh'
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




                {wallet && isActive && whitelistEnabled && (whitelistTokenBalance > 0) && isBurnToken &&
                <Typography variant={mobileMarker ? "h4" : 'h3'} style={{
                    color: '#fff',
                    fontFamily: 'Main',
                    fontWeight: 'bold',
                }}>You are whitelisted</Typography>}

                <Container maxWidth="md">
                    <Paper style={{
                        marginTop: mobileMarker ? '4rem' : '3rem',
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
                                    Collection Name
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


