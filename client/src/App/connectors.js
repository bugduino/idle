import WalletLink from 'walletlink';
import AuthereumApi from 'authereum';
import PortisApi from "@portis/web3";
import FortmaticApi from "fortmatic";
import TrezorApi from "trezor-connect";
import { Connectors } from "web3-react";
import TorusApi from '@toruslabs/torus-embed';
import globalConfigs from '../configs/globalConfigs';
import TorusConnector from './connectors/TorusConnector';
import AuthereumConnector from './connectors/AuthereumConnector';
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLinkConnector from './connectors/WalletLinkConnector';
import WalletConnectConnector from './connectors/WalletConnectConnector';

const {
  InjectedConnector,
  NetworkOnlyConnector,
  TrezorConnector,
  LedgerConnector,
  FortmaticConnector,
  PortisConnector
} = Connectors;

const env = process.env;

const manifestEmail = env.REACT_APP_TREZOR_MANIFEST_EMAIL; // trezor
const manifestAppUrl = env.REACT_APP_TREZOR_MANIFEST_URL; // trezor
const defaultNetwork = globalConfigs.network.requiredNetwork;
const fortmaticApiKey = env.REACT_APP_FORTMATIC_KEY_MAINNET;
const portisDAppId = env.REACT_APP_PORTIS_DAPP_ID;
const portisNetwork = env.REACT_APP_PORTIS_NETWORK;

const supportedNetworkURLs = {};
  
Object.keys(globalConfigs.network.providers.infura).forEach((networkId,index) => {
  supportedNetworkURLs[networkId] = globalConfigs.network.providers.infura[networkId]+env.REACT_APP_INFURA_KEY;
});

const Injected = new InjectedConnector({
  supportedNetworks: [defaultNetwork]
});

const Infura = new NetworkOnlyConnector({
  providerURL: globalConfigs.network.providers.infura[defaultNetwork]+env.REACT_APP_INFURA_KEY
});


const Trezor = new TrezorConnector({
  api: TrezorApi,
  supportedNetworkURLs,
  defaultNetwork,
  manifestEmail,
  manifestAppUrl
});

const Ledger = new LedgerConnector({
  supportedNetworkURLs,
  defaultNetwork
});

const WalletConnect = new WalletConnectConnector({
  defaultNetwork,
  supportedNetworkURLs,
  api: WalletConnectProvider,
  infuraId:env.REACT_APP_INFURA_KEY,
  bridge: "https://bridge.walletconnect.org",
});

const Fortmatic = new FortmaticConnector({
  api: FortmaticApi,
  apiKey: fortmaticApiKey,
  logoutOnDeactivation: false
});

const Portis = new PortisConnector({
  api: PortisApi,
  dAppId: portisDAppId,
  network: portisNetwork
});

const Authereum = new AuthereumConnector({
  api: AuthereumApi,
  network: globalConfigs.network.availableNetworks[defaultNetwork].toLowerCase()
});

const walletLink = new WalletLinkConnector({
  api: WalletLink,
  darkMode: false,
  chainId: defaultNetwork,
  appName: globalConfigs.appName,
  infuraUrl: supportedNetworkURLs[defaultNetwork],
  appLogoUrl: 'https://idle.finance/images/idle-mark.png',
});

const Torus = new TorusConnector({
  api: TorusApi,
  initParams:{
    buildEnv: 'production', // default: production
    enableLogging: false, // default: false
    network: {
      host: globalConfigs.network.availableNetworks[defaultNetwork].toLowerCase(), // default: mainnet
      chainId: defaultNetwork, // default: 1
      networkName: globalConfigs.network.availableNetworks[defaultNetwork].toLowerCase() // default: Main Ethereum Network
    },
    showTorusButton: false // default: true
  }
});

export default {
  Injected,
  Infura,
  WalletConnect,
  walletLink,
  Fortmatic,
  Portis,
  Authereum,
  Torus,
  Trezor,
  Ledger,
};