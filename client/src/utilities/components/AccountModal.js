import React from "react";
import {
  Heading,
  // Text,
  Modal,
  Box,
  Flex,
  // Image,
  EthAddress
} from "rimble-ui";
import ModalCard from './ModalCard';
import AssetField from '../../AssetField/AssetField.js';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';
import styles from '../../CryptoInput/CryptoInput.module.scss';

class AccountModal extends React.Component {

  state = {
    logout: false,
    balances: null
  }

  loadBalances = async () => {

    if (!this.props.availableStrategies || !this.props.contractsInitialized || !this.props.account || this.state.balances !== null){
      return false;
    }

    const balances = [];
    const allTokens = Object.keys(this.props.availableStrategies.best);

    // await this.functionsUtil.asyncForEach(allTokens, async (baseToken) => {
    allTokens.forEach( baseToken => {
      const tokens = [];
      tokens.push(baseToken);
      Object.keys(this.props.availableStrategies).forEach( strategy => {
        const strategyToken = this.props.availableStrategies[strategy][baseToken];
        if (strategyToken){
          tokens.push(strategyToken.idle.token);
        }
      });

      balances.push(tokens);
      /*
      const tokenBalances = {};

      tokenBalances[baseToken] = await this.functionsUtil.getTokenBalance(baseToken,this.props.account);

      await this.functionsUtil.asyncForEach(Object.keys(this.props.availableStrategies), async (strategy) => {
        const strategyToken = this.props.availableStrategies[strategy][baseToken];
        if (strategyToken){
          tokenBalances[strategyToken.idle.token] = await this.functionsUtil.getTokenBalance(strategyToken.idle.token,this.props.account);
        }
      });

      balances.push(tokenBalances);
      */
    });

    this.setState({
      balances
    });
  }

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  componentWillMount() {
    this.loadUtils();
  }

  componentDidMount() {
    this.loadUtils();
    this.loadBalances();
  }

  componentDidUpdate(prevProps) {
    this.loadUtils();

    const accountChanged = prevProps.acccount !== this.props.account;
    const contractsInitialized = !prevProps.contractsInitialized && this.props.contractsInitialized;
    const availableStrategiesChanged = !prevProps.availableStrategies && this.props.availableStrategies;
    if (availableStrategiesChanged || accountChanged || contractsInitialized){
      this.loadBalances();
    }
  }

  setConnector = async (connectorName) => {
    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Connect',
      eventAction: 'logout'
    });

    if (typeof this.props.setConnector === 'function'){
      this.props.setConnector(connectorName);
    }

    return await this.props.context.setConnector(connectorName);
  }

  async logout(){
    this.setState({
      logout:true
    });

    this.props.logout();
    await this.setConnector('Infura');
    // this.props.closeModal();
  }

  render(){
    if (this.props.account){
      // let renderBalances = null;

      const rows = (Object.keys(this.props.availableStrategies).length+1);
      const renderBalances = this.state.balances && this.state.balances.map( (tokens,i) => {
        return (
          <Flex
            mt={2}
            width={1}
            boxShadow={0}
            key={'balance_'+i}
            alignItems={'center'}
            flexDirection={'row'}
            >
              {
                tokens.map( (token,tokenIndex) => (
                  <Flex
                    width={1/rows}
                    flexDirection={'row'}
                    key={'balance_token_'+token}
                    justifyContent={'flex-start'}
                  >
                    <AssetField
                      token={token}
                      tokenConfig={{
                        token:token
                      }}
                      fieldInfo={{
                        name:'icon',
                        props:{
                          mr:[1,2],
                          ml:[1,4],
                          width:['1.4em','2em'],
                          height:['1.4em','2em']
                        }
                      }}
                    />
                    <AssetField
                      {...this.props}
                      token={token}
                      tokenConfig={{
                        token:token
                      }}
                      fieldInfo={{
                        name:'tokenBalance',
                        props:{
                          fontSize:[0,2],
                          fontWeight:500,
                          color:'cellText'
                        }
                      }}
                    />
                  </Flex>
                ) )
              }
          </Flex>
        );
      });

      return (
        <Modal isOpen={this.props.isOpen}>
          <ModalCard closeFunc={this.props.closeModal}>
            <ModalCard.Header title={'Account overview'}></ModalCard.Header>
            <ModalCard.Body>
              <Flex
                width={["auto", "40em"]}
                flexDirection={'column'}
                alignItems={'center'}
                justifyContent={'center'}>
                <Flex
                  flexDirection={'column'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  my={[2,3]}>
                  <Box style={{'wordBreak': 'break-word'}}>
                    <EthAddress address={this.props.account} />
                  </Box>
                </Flex>
                <Flex
                  mb={3}
                  width={'100%'}
                  alignItems={'center'}
                  maxWidth={['100%','30em']}
                  flexDirection={'column'}
                >
                  <Heading.h4
                    textAlign={'center'}
                  >
                    Balances
                  </Heading.h4>
                  { renderBalances }
                </Flex>
              </Flex>
            </ModalCard.Body>

            <ModalCard.Footer>
              {(this.props.context.active || (this.props.context.error && this.props.context.connectorName)) && (
                <ButtonLoader
                  buttonProps={{className:styles.gradientButton,borderRadius:'2rem',mt:[4,8],minWidth:['95px','145px'],size:['auto','medium']}}
                  handleClick={ async () => { await this.logout() } }
                  buttonText={'Logout wallet'}
                  isLoading={this.state.logout}
                >
                </ButtonLoader>
              )}
            </ModalCard.Footer>
          </ModalCard>
        </Modal>
      );
    }
    return null;
  }
}

export default AccountModal;
