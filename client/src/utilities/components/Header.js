import React from "react";
import BuyModal from "./BuyModal";
import styles from './Header.module.scss';
import AccountModal from "./AccountModal";
import AccountOverview from "./AccountOverview";
import { Box, Flex, Button, Image } from "rimble-ui";
import FunctionsUtil from '../FunctionsUtil';
import ButtonGroup from '../../ButtonGroup/ButtonGroup';
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';
import TokenSelector from '../../TokenSelector/TokenSelector';

import {
  Link as RouterLink,
  useHistory
} from "react-router-dom";

class Header extends React.Component {
  state = {
    idleTokenBalance: null,
    isModalOpen: null,
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

  toggleModal = (modalName) => {
    this.setState(state => ({...state, isModalOpen: (state.isModalOpen===modalName ? null : modalName) }));
  }

  gotoPage = (url) => {
    let history = useHistory();
    history.push(url);
  }

  setCurrentToken = () => {
    function StatsComponent(props) {
      return (
        <RouterLink to="/stats" style={ props.isMobile ? {textDecoration:'none',width:'100%'} : {textDecoration:'none'}  }>
          <Button
            {...props}
          >
            STATS
          </Button>
        </RouterLink>
      );
    }

    const buttonGroup = [
      {
        component:StatsComponent,
        props:{
          mainColor:'transparent',
          color:'white',
          icon:'ShowChart',
          iconpos:'right',
        },
        style:{
          marginBottom:'0 !important'
        }
      },
      {
        component:Button,
        props:{
          mainColor:'transparent',
          color:'white',
          icon:'AddCircleOutline',
          iconpos:'right',
          onClick: e => { this.props.account ? this.props.openBuyModal(e) : this.props.connectAndValidateAccount() }
        },
        value:'ADD FUNDS'
      },
      {
        component:TokenSelector,
        props:{
          setSelectedToken:this.props.setSelectedToken,
          selectedToken:this.props.selectedToken,
          availableTokens:this.props.availableTokens
        }
      }
    ];

    this.setState({
      buttonGroup
    });
  }

  closeBuyModal = (e) => {
    if (e){
      e.preventDefault();
    }
    this.toggleModal('buy');
    this.props.closeBuyModal(e);
  }

  async componentWillMount() {
    this.loadUtils();
    this.setCurrentToken();
  }

  async componentDidMount() {

    this.loadUtils();

    // do not wait for each one just for the first who will guarantee web3 initialization
    const web3 = await this.props.initWeb3();
    if (!web3) {
      return false;
    }
  }

  async componentDidUpdate(prevProps, prevState) {

    this.loadUtils();

    const accountUpdated = prevProps.account !== this.props.account;
    const tokenUpdated = prevProps.selectedToken !== this.props.selectedToken;
    const accountBalanceUpdated = prevProps.accountBalanceToken !== this.props.accountBalanceToken;

    if (tokenUpdated){
      this.setCurrentToken();
    }

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }

    if (this.props.account && (accountUpdated || accountBalanceUpdated)) {

      let idleTokenBalance = await this.functionsUtil.getProtocolBalance(this.props.tokenConfig.idle.token,this.props.account);
      if (idleTokenBalance){
        idleTokenBalance = this.functionsUtil.BNify(idleTokenBalance).div(1e18);
        this.setState({
          idleTokenBalance
        });
      }
    }
  }

  render() {

    const buttonSize = this.props.isMobile ? 'small' : 'medium';

    return (
      <Box style={{
        'position': 'absolute',
        'left': '0',
        'right': '0',
        'zIndex': 99
        }}
      >
        <Flex
          width={['98%','100%']}
          ml={['1%',0]}
          bg={"transparent"}
          pt={[3,4]}
          alignItems={['center','flex-end']}
        >
          <Box ml={[3, 5]} width={[1, 3/12]}>
            <RouterLink to="/">
              <Image src="images/logo.svg"
                height={['35px','48px']}
                position={'relative'} />
            </RouterLink>
          </Box>
          <Box width={[1,8/12]} justifyContent="flex-end">
            <Flex alignItems={"center"} justifyContent="flex-end">
              {
                !this.props.isMobile &&
                  <ButtonGroup isMobile={this.props.isMobile} components={this.state.buttonGroup} />
              }
              {
                this.props.account ? (
                  <AccountOverview
                    account={this.props.account}
                    hasQRCode={false}
                    isMobile={this.props.isMobile}
                    selectedToken={this.props.selectedToken}
                    accountBalanceLow={this.props.accountBalanceLow}
                    accountBalance={this.props.accountBalance}
                    accountBalanceToken={this.props.accountBalanceToken}
                    toggleModal={e => this.toggleModal('account') }
                  />
                ) : (
                  <ButtonLoader
                    buttonProps={{className:styles.gradientButton,borderRadius:'2rem',my:8,ml:16,minWidth:['95px','145px'],size:buttonSize}}
                    handleClick={this.props.connectAndValidateAccount}
                    buttonText={'CONNECT'}
                    isLoading={this.props.connecting}
                  >
                  </ButtonLoader>
                )
              }
              {
                this.props.isMobile &&
                  <ButtonGroup isMobile={this.props.isMobile} components={this.state.buttonGroup} />
              }
            </Flex>
          </Box>
        </Flex>
        <BuyModal
          account={this.props.account}
          tokenConfig={this.props.tokenConfig}
          walletProvider={this.props.walletProvider}
          connectorName={this.props.connectorName}
          getAccountBalance={this.props.getAccountBalance}
          getTokenDecimals={this.props.getTokenDecimals}
          selectedToken={this.props.selectedToken}
          accountBalance={this.props.accountBalance}
          accountBalanceToken={this.props.accountBalanceToken}
          buyToken={this.props.buyToken}
          idleTokenBalance={this.state.idleTokenBalance}
          isOpen={this.props.buyModalOpened}
          isMobile={this.props.isMobile}
          closeModal={ e => this.closeBuyModal(e) }
          network={this.props.network.current} />
        <AccountModal
          context={this.props.context}
          account={this.props.account}
          selectedToken={this.props.selectedToken}
          accountBalance={this.props.accountBalance}
          accountBalanceToken={this.props.accountBalanceToken}
          idleTokenBalance={this.state.idleTokenBalance}
          isOpen={this.state.isModalOpen==='account'}
          isMobile={this.props.isMobile}
          setConnector={this.props.setConnector}
          closeModal={e => this.toggleModal('account') }
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default Header;
