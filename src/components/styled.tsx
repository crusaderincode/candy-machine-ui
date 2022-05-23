import styled from "styled-components";
import {LinearProgress, Paper} from "@mui/material";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";


export const MainContainer = styled.div`
      display: flex;
      flex-direction: column;
      margin-top: 20px;
      margin-bottom: 20px;
      text-align: center;
      justify-content: center;
    `;

export const WalletContainer = styled.div`
  position: absolute; 
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

export const WalletAmount = styled.div`
  color: #fff;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  background-color: var(--light-background-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

export const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

export const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
`;

export const FullWidthConnectButton = styled(WalletMultiButton)`
  border-radius: 10px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
  width: 100%;
`;


export const BorderLinearProgress = styled(LinearProgress)`
  margin: 15px;
  height: 10px !important;
  border-radius: 30px;
  color: var(--title-text-color);
  border: 2px solid white;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
  background-color: #fff !important;
  
 .MuiLinearProgress-barColorPrimary{
    background-color:var(--title-text-color) !important;
  }
  
  .MuiLinearProgress-barColorPrimary{
    background-color:var(--title-text-color) !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    border-radius: 30px !important;
    background-image: linear-gradient(270deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.5));
  }
`;


