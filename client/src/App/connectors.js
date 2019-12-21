import { Connectors } from "web3-react";
import TrezorApi from "trezor-connect";
import WalletConnectApi from "@walletconnect/web3-subprovider";
import FortmaticApi from "fortmatic";
import PortisApi from "@portis/web3";
import globalConfigs from '../configs/globalConfigs';

const {
  InjectedConnector,
  NetworkOnlyConnector,
  TrezorConnector,
  LedgerConnector,
  WalletConnectConnector,
  FortmaticConnector,
  PortisConnector
} = Connectors;

const env = process.env;

const manifestEmail = env.REACT_APP_TREZOR_MANIFEST_EMAIL; // trezor
const manifestAppUrl = env.REACT_APP_TREZOR_MANIFEST_URL; // trezor
// const defaultNetwork = 1; // mainnet
const defaultNetwork = globalConfigs.network.requiredNetwork; // Kovan
// const defaultNetwork = 4; // rinkeby
const fortmaticApiKey = env.REACT_APP_FORTMATIC_KEY_RINKEBY;
const portisDAppId = env.REACT_APP_PORTIS_DAPP_ID;
const portisNetwork = env.REACT_APP_PORTIS_NETWORK;

const supportedNetworkURLs = {};
supportedNetworkURLs[defaultNetwork] = globalConfigs.network.providers.infura[defaultNetwork]+env.REACT_APP_INFURA_KEY;

const Injected = new InjectedConnector({
  supportedNetworks: [defaultNetwork]
});

const Infura = new NetworkOnlyConnector({
  providerURL: supportedNetworkURLs[defaultNetwork]
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
  api: WalletConnectApi,
  bridge: "https://bridge.walletconnect.org",
  supportedNetworkURLs,
  defaultNetwork
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

export default {
  Injected,
  Infura,
  Fortmatic,
  Trezor,
  Ledger,
  WalletConnect,
  Portis
};