import Connector from 'web3-react/dist/connectors/connector';

export default class WalletLinkConnector extends Connector {

  constructor(kwargs) {
    const { api: WalletLink, appName, infuraUrl, chainId, appLogoUrl, ...rest } = kwargs;
    super(rest);

    this.provider = null;
    this.walletLink = null;
    this.appName = appName;
    this.chainId = chainId;
    this.infuraUrl = infuraUrl;
    this.appLogoUrl = appLogoUrl;
    this.WalletLink = WalletLink;
  }

  async onActivation() {
    if (!this.walletLink){
      this.walletLink = new this.WalletLink({
        darkMode: false,
        appName: this.appName,
        infuraUrl: this.infuraUrl,
        appLogoUrl: this.appLogoUrl,
      });
    }

    const provider = this.getProvider();
    if (provider){
      await provider.enable();
      return provider;
    }
  }

  getProvider(){
    if (!this.provider){
      this.provider = this.walletLink.makeWeb3Provider(this.infuraUrl, this.chainId);
    }
    return this.provider;
  }

  async getAccount(provider) {
    if (provider){
      // Use eth_RequestAccounts
      const accounts = await provider.send('eth_requestAccounts');
      if (accounts && accounts.length){
        return accounts[0];
      }
    }
    return null;
  }

  async disable() {
    const provider = this.getProvider();
    if (provider){
      await provider.close();
      return provider;
    }
  }

  changeNetwork(network) {
    this.constructor({
      network,
      api: this.WalletLink,
      appName: this.appName,
      chainId: this.chainId,
      infuraUrl: this.infuraUrl,
      appLogoUrl: this.appLogoUrl,
    })
    super._web3ReactUpdateHandler({ updateNetworkId: true })
  }
}
