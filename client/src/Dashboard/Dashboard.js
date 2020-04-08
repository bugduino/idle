import React, { Component } from 'react';
import DashboardMenu from './DashboardMenu';
// import styles from './Dashboard.module.scss';
// import globalConfigs from '../configs/globalConfigs';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Card, Image, Loader, Text } from 'rimble-ui';

// Import page components
import Stats from '../Stats/Stats';
import RiskAdjustedStrategy from '../RiskAdjustedStrategy/RiskAdjustedStrategy';
// import BestYieldStrategy from {};

class Dashboard extends Component {
  state = {
    menu:[],
    currentRoute:null,
    pageComponent:null,
    selectedToken:null,
    selectedStrategy:null,
    baseRoute:'/dashboard',
  };

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async loadMenu() {
    const menu = [
      {
        icon:'Home',
        label:'Home',
        route:'/',
        selected:false,
        submenu:[]
      },
      {
        icon:'VerifiedUser',
        label:'Risk-Adjusted',
        route:'/dashboard/risk',
        bgColor:'#2196F3',
        color:'#fff',
        selected:false,
        component:RiskAdjustedStrategy,
        submenu:[
          {
            icon:null,
            label:'DAI',
            route:'DAI',
            selected:false,
            submenu:[]
          },
          {
            icon:null,
            label:'USDC',
            route:'USDC',
            selected:false,
            submenu:[]
          },
        ]
      },
      {
        color:'#fff',
        selected:false,
        icon:'Whatshot',
        bgColor:'#f32121',
        label:'Best-Yield',
        component:null,
        route:'/dashboard/best',
        submenu:[
          {
            icon:null,
            label:'DAI',
            route:'DAI',
            selected:false,
            submenu:[]
          },
          {
            icon:null,
            label:'USDC',
            route:'USDC',
            selected:false,
            submenu:[]
          },
        ]
      },
      {
        icon:'Equalizer',
        label:'Stats',
        bgColor:'#21f36b',
        color:'dark-gray',
        component:Stats,
        route:'/dashboard/stats',
        selected:false,
        submenu:[]
      }
    ];

    await this.setState({
      menu
    });
  }

  async loadParams() {
    const { match: { params } } = this.props;
    let currentRoute = this.state.baseRoute;

    let selectedToken = null;
    let selectedStrategy = null;

    if (params.strategy){
      selectedStrategy = params.strategy;
      currentRoute += '/'+selectedStrategy;
      if (params.asset){
        // Check if the asset is valid
        if (Object.keys(this.props.availableTokens).includes(params.asset.toUpperCase())){
          selectedToken = params.asset.toUpperCase();
          currentRoute += '/'+selectedToken;
        }
      }
    }

    const menu = this.state.menu;
    let pageComponent = null;

    menu.forEach(m => {
      m.selected = false;
      if (currentRoute.toLowerCase() === m.route.toLowerCase()){
        m.selected = true;
        pageComponent = m.component;
      } else if (m.submenu.length) {
        m.submenu.forEach(subm => {
          subm.selected = false;
          const submRoute = m.route+'/'+subm.route;
          if (submRoute.toLowerCase() === currentRoute.toLowerCase()){
            m.selected = true;
            subm.selected = true;
            // Set component, if null use parent
            if (subm.component){
              pageComponent = subm.component;
            } else {
              pageComponent = m.component;
            }
          }
        })
      }
    });

    await this.setState({
      menu,
      params,
      currentRoute,
      selectedToken,
      pageComponent,
      selectedStrategy
    });
  }

  async componentWillMount() {
    this.checkAccountConnected();

    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  async componentDidMount() {

    this.checkAccountConnected();

    if (!this.props.web3){
      this.props.initWeb3();
      return false;
    }

    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  checkAccountConnected(){
    if (this.props.accountInizialized && !this.props.account){
      window.location = '/';
      return false;
    }
    return true;
  }

  async componentDidUpdate(prevProps,prevState) {
    this.checkAccountConnected();

    const prevParams = prevProps.match.params;
    const params = this.props.match.params;
    if (JSON.stringify(prevParams) !== JSON.stringify(params)){
      this.loadParams();
    }
  }

  render() {
    if (this.props.accountInizialized && !this.props.account){
      return null;
    }

    const PageComponent = this.state.pageComponent ? this.state.pageComponent : null;
    return (
      <Flex flexDirection={'row'} width={'100%'} height={'100vh'} position={'fixed'}>
        <Flex flexDirection={'column'} width={1/6}>
          <Card height={'100vh'} p={0}>
            <Flex flexDirection={'column'}>
              <Flex p={3} pb={0} flexDirection={'row'} alignItems={'center'}>
                <RouterLink to="/">
                  <Image src="images/logo-gradient.svg"
                    height={['35px','48px']}
                    position={'relative'} />
                </RouterLink>
              </Flex>
              <DashboardMenu menu={this.state.menu} />
            </Flex>
          </Card>
        </Flex>
        <Flex
          width={5/6}
          style={{overflow:'scroll'}}
          py={[3,4]}
          px={[3,5]}
        >
          {
            !this.props.accountInizialized || !this.props.contractsInitialized? (
              <Flex
                justifyContent={'center'}
                alignItems={'center'}
                textAlign={'center'}
                width={1}
                minHeight={'100vh'}
              >
                <Loader size="30px" /> <Text ml={2}>Loading data...</Text>
              </Flex>
            ) : PageComponent &&
                  <PageComponent
                    match={{
                      params:{}
                    }}
                    web3={this.props.web3}
                    account={this.props.account}
                    initWeb3={this.props.initWeb3}
                    isMobile={this.props.isMobile}
                    contracts={this.props.contracts}
                    tokenConfig={this.props.tokenConfig}
                    selectedToken={this.state.selectedToken}
                    availableTokens={this.props.availableTokens}
                    selectedStrategy={this.state.selectedStrategy}
                    />
          }
        </Flex>
      </Flex>
    );
  }
}

export default Dashboard;