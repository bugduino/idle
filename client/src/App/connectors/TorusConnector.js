import Connector from 'web3-react/dist/connectors/connector';

export default class TorusConnector extends Connector {

  constructor(kwargs) {
    const { api: Torus, initParams, ...rest } = kwargs;
    super(rest);

    this.torus = null;
    this.Torus = Torus;
    this.initParams = initParams;
  }

  async onActivation() {
    if (!this.torus) {
      this.torus = new this.Torus({
        buttonPosition: "bottom-right" // default: bottom-left
      });
    }
    await this.torus.init();
    await this.torus.login();
  }

  async getProvider(){
    return new Promise( async (resolve, reject) => {
      resolve(this.torus.provider);
    });
  }

  async getAccount(provider) {
    const userInfo = await this.torus.getUserInfo();
    if (userInfo){
      return await this.torus.getPublicAddress({
        verifier:userInfo.verifier,
        verifierId:userInfo.verifierId
      });
    }
    return null;
  }

  async onDeactivation() {
    await this.torus.logout();
  }

  changeNetwork(network) {
    super._web3ReactUpdateHandler({ updateNetworkId: true })
  }
}
