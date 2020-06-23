import Connector from 'web3-react/dist/connectors/connector';

export default class AuthereumConnector extends Connector {

  constructor(kwargs) {
    const { api: Authereum, network, ...rest } = kwargs;
    super(rest);

    this.authereum = null;
    this.Authereum = Authereum;
    this.network = network;
  }

  async onActivation() {
    if (!this.authereum) {
      this.authereum = new this.Authereum(this.network);
    }
    const provider = await this.getProvider();
    if (provider){
      await provider.enable();
      return provider;
    }
  }

  async getProvider(){
    return new Promise( async (resolve, reject) => {
      resolve(this.authereum.getProvider());
    });
  }

  async getAccount(provider) {
    if (provider){
      const accounts = await provider.getAccounts();
      if (accounts && accounts.length){
        return accounts[0];
      }
    }
    return null;
  }

  async disable() {
    const provider = await this.getProvider();
    if (provider){
      await provider.disable();
      return provider;
    }
  }

  changeNetwork(network) {
    this.constructor({
      api: this.Authereum,
      network
    })
    super._web3ReactUpdateHandler({ updateNetworkId: true })
  }
}
