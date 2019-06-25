import { Connectors } from "web3-react";
import TrezorApi from "trezor-connect";
// import WalletConnectApi from "@walletconnect/web3-subprovider";
import FortmaticApi from "fortmatic";
// import PortisApi from "@portis/web3";

const {
  InjectedConnector,
  // NetworkOnlyConnector,
  TrezorConnector,
  LedgerConnector,
  // WalletConnectConnector,
  FortmaticConnector,
  // PortisConnector
} = Connectors;


const env = process.env;

const supportedNetworkURLs = {
  1: `https://mainnet.infura.io/v3/${env.REACT_APP_INFURA_KEY_MAINNET}`,
  4: `https://rinkeby.infura.io/v3/${env.REACT_APP_INFURA_KEY_RINKEBY}`,
};
const manifestEmail = env.REACT_APP_TREZOR_MANIFEST_EMAIL; // trezor
const manifestAppUrl = env.REACT_APP_TREZOR_MANIFEST_URL; // trezor
const defaultNetwork = 4; // rinkeby
const fortmaticApiKey = env.REACT_APP_FORTMATIC_KEY_RINKEBY;

const Injected = new InjectedConnector({
  supportedNetworks: [1, 4]
});

// const Network = new NetworkOnlyConnector({
//   providerURL: supportedNetworkURLs[1]
// });

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

// const WalletConnect = new WalletConnectConnector({
//   api: WalletConnectApi,
//   bridge: "https://bridge.walletconnect.org",
//   supportedNetworkURLs,
//   defaultNetwork
// });

const Fortmatic = new FortmaticConnector({
  api: FortmaticApi,
  apiKey: fortmaticApiKey,
  logoutOnDeactivation: false
});

// const Portis = new PortisConnector({
//   api: PortisApi,
//   dAppId: portisDAppId,
//   network: portisNetwork,
// });

export default {
  Injected,
  Fortmatic,
  // Network,
  Trezor,
  Ledger,
  // WalletConnect,
  // Portis
};
