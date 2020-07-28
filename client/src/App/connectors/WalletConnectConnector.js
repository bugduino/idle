import Connector from 'web3-react/dist/connectors/connector';

export default class WalletConnectConnector extends Connector {

  constructor(kwargs) {
    const { api: WalletConnectProvider, defaultNetwork, infuraId, ...rest } = kwargs;
    super(rest);

    this.provider = null;
    this.WalletConnectProvider = WalletConnectProvider;
    this.infuraId = infuraId;
  }

  async onActivation() {
    if (!this.provider) {
      this.provider = new this.WalletConnectProvider({
        infuraId:this.infuraId
      });
    }

    // console.log('onActivation',this.provider);

    if (this.provider){

      await this.provider.enable();

      /*
      // Subscribe to accounts change
      this.provider.on("accountsChanged", (accounts) => {
        console.log('accountsChanged',accounts);
      });

      // Subscribe to chainId change
      this.provider.on("chainChanged", (chainId) => {
        console.log('chainChanged',chainId);
      });

      // Subscribe to networkId change
      this.provider.on("networkChanged", (networkId) => {
        console.log('networkChanged',networkId);
      });

      // Subscribe to session connection/open
      this.provider.on("open", () => {
        console.log('open');
      });

      // Subscribe to session disconnection/close
      this.provider.on("close", (code, reason) => {
        console.log('close',code, reason);
      });
      */

      return this.provider;
    }
  }

  async getProvider(){
    return this.provider;
  }

  async disable() {
    if (this.provider){
      this.provider.close();
      return this.provider;
    }
  }
}
