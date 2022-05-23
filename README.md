# Intoduction
**candy-machine-ui** is a fork of [Fulgurus/candy-machine-v2-responsive-ui](https://github.com/pandao/editor.md "link") repo.

## Features

- **Auto refresh.** Every few seconds ui is updated, This allows you to track the amount of minted NFTs in real time.  
- **Auto timers.** If the presale option is enabled and the time is set, the minting timer will be different for WL members.
-  **WL suport.** Everything is already set, just specify the dates of presale.
- **No wallet connection needed to see mint date and price.** To achive this, you need to add this data to the constants.
-  **Fully mobile adopted.** Everything works just out of the box.
-  **MUI v5 suport.** Instead MUI v4 in the original repo.

## Installation

#### 1. Fork the project & clone it. 

```
git clone https://github.com/GottliebGlob/candy-machine-ui.git
```

#### 2. Define your environment variables (.env file)

Rename the `.env.example` file at the root directory to `.env` and update the following variables in the `.env` file:

```
REACT_APP_CANDY_MACHINE_ID=__PLACEHOLDER__
```
set __PLACEHOLDER__ with the candy machine pubkey you get once you upload & create your candy machine in Metaplex project. You can find back the value from the `.cache/temp.json` file of your Metaplex project. This file is created when you run the `ts-node candy-machine-v2-cli.ts upload ...` command.

```
REACT_APP_SOLANA_NETWORK=devnet
```

This identifies the Solana network you want to connect to. Options are `devnet`, `testnet`, and `mainnet`.

```
REACT_APP_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

This identifies the RPC server your web app will access the Solana network through.


If you are using a custom SPL Token to MINT, you have two additional environment parameters to set :


```
REACT_APP_SPL_TOKEN_TO_MINT_NAME=
```

Spl-token name to display next the price.

```
REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS=9
```

Spl-token decimals were defined during its creation with --decimals parameter. If you didn't use that parameter, then by default your SPL Token got 9 decimals.

#### 3. Build the project :

To install dependencies :

```
yarn install
```

To test the app locally in the development mode (localhost:3000) :

```
yarn start
```

To build the production package (generated in build folder of the project) :

```
yarn build
```

### More info in the original repo:  [Fulgurus/candy-machine-v2-responsive-ui](https://github.com/pandao/editor.md "link")

#### 3. Build the project and test. Go to the root project directory and type the commands :

To install dependencies :

```
yarn install
```

To test the app locally in the development mode (localhost:3000) :

```
yarn start
```

To build the production package (generated in build folder of the project) :

```
yarn build
```

## Customization 
 ### Data

   #####  `constants.ts` 
   - #### Set date and time for public mint :
   ```
   export const startDate = new Date("19 May 2022 17:00:00 GMT")
   ```
  - #### Set date and time for presale mint (if there is a WL) :
   ```
export const startWlDate = new Date("19 May 2022 16:00:00 GMT")
   ```
  
 - #### Set mint price :
  ```
export const mintPrice = '0.1'
   ```
- #### Set supply :
 ```
export const supply = 10
   ```
### Styles
 
#####  `App.css` : update this variables with your custom colors :

```
:root {
 --light-background-color: #2e3d4d;
  --main-background-color: #131a21;
  --dark-background-color: #0a0e11;
  --title-text-color:#00d0c1;
  }
  ```
  
  #####  `index.tsx` : the same color but for using with __MUI__ :
```
 palette: {
        primary: {
            light: '#2e3d4d',
            main: '#131a21',
            dark: '#0a0e11',
            contrastText: '#ff00b2'
        },
  ```
  

   
   
   

