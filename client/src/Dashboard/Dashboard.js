import React, { Component } from 'react';
import DashboardMenu from './DashboardMenu';
import { Flex, Card } from 'rimble-ui';
import FlexLoader from '../FlexLoader/FlexLoader';
import FunctionsUtil from '../utilities/FunctionsUtil';

// Import page components
import Stats from '../Stats/Stats';
import AssetPage from '../AssetPage/AssetPage';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import RiskAdjustedStrategy from '../RiskAdjustedStrategy/RiskAdjustedStrategy';
// import BestYieldStrategy from {};

class Dashboard extends Component {
  state = {
    menu:[],
    currentRoute:null,
    pageComponent:null,
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
      /*
      {
        icon:'Home',
        label:'Home',
        route:'/',
        selected:false,
        submenu:[]
      },
      */
      {
        icon:'VerifiedUser',
        label:'Risk Adjusted',
        route:'/dashboard/risk',
        bgColor:'#2196F3',
        color:'#fff',
        selected:false,
        component:RiskAdjustedStrategy,
        submenu:[
          /*
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
          */
        ]
      },
      {
        color:'#fff',
        selected:false,
        icon:'Whatshot',
        bgColor:'#f32121',
        label:'Best Yield',
        component:null,
        route:'/dashboard/best',
        submenu:[
          /*
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
          */
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

    const baseRoute = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute']);
    let currentRoute = baseRoute;

    let selectedToken = null;
    let selectedStrategy = null;
    let pageComponent = null;

    // Set strategy
    if (params.strategy){
      selectedStrategy = params.strategy;
      currentRoute += '/'+selectedStrategy;

      // Set token
      if (params.asset){
        selectedToken = params.asset.toUpperCase();
        currentRoute += '/'+selectedToken;
        pageComponent = AssetPage;
      }
    }

    const menu = this.state.menu;

    menu.forEach(m => {
      m.selected = false;
      const strategyRoute = baseRoute+'/'+selectedStrategy;
      if (currentRoute.toLowerCase() === m.route.toLowerCase() || m.route.toLowerCase() === strategyRoute.toLowerCase()){
        m.selected = true;
        if (pageComponent === null){
          pageComponent = m.component;
        }
      } else if (m.submenu.length) {
        m.submenu.forEach(subm => {
          subm.selected = false;
          const submRoute = m.route+'/'+subm.route;
          if (submRoute.toLowerCase() === currentRoute.toLowerCase()){
            m.selected = true;
            subm.selected = true;
            // Set component, if null use parent
            if (pageComponent === null){
              if (subm.component){
                pageComponent = subm.component;
              } else {
                pageComponent = m.component;
              }
            }
          }
        })
      }
    });

    if (selectedStrategy){
      await this.props.setStrategy(selectedStrategy);
    }

    if (selectedToken){
      await this.props.setToken(selectedToken);
    }

    await this.setState({
      menu,
      params,
      currentRoute,
      pageComponent,
      selectedStrategy
    });
  }

  async componentWillMount() {
    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  async componentDidMount() {

    if (!this.props.web3){
      this.props.initWeb3();
      return false;
    } else if (!this.props.accountInizialized){
      this.props.initAccount();
    } else if (!this.props.contractsInitialized){
      this.props.initializeContracts();
    }

    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  async componentDidUpdate(prevProps,prevState) {
    const prevParams = prevProps.match.params;
    const params = this.props.match.params;
    if (JSON.stringify(prevParams) !== JSON.stringify(params)){
      this.loadParams();
    }
  }

  changeToken(selectedToken){
    selectedToken = selectedToken.toUpperCase();
    if (Object.keys(this.props.availableTokens).includes(selectedToken)){
      const baseRoute = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute']);
      window.location.hash=baseRoute+'/'+this.state.selectedStrategy+'/'+selectedToken;
      window.scrollTo(0, 0);
    }
  }

  render() {
    const PageComponent = this.state.pageComponent ? this.state.pageComponent : null;
    // console.log('accountInizialized','contractsInitialized',this.props.accountInizialized,this.props.contractsInitialized);
    return (
      <Flex
        width={'100%'}
        height={'100vh'}
        position={'fixed'}
        flexDirection={'row'}
      >
        <Flex flexDirection={'column'} width={1/6}>
          <Card height={'100vh'} p={0}>
            <DashboardMenu
              {...this.props}
              menu={this.state.menu}
            />
          </Card>
        </Flex>
        <Flex
          py={3}
          px={[3,5]}
          width={5/6}
          style={{overflow:'scroll'}}
          backgroundColor={'dashboardBg'}
        >
          {
            !this.props.accountInizialized || !this.props.contractsInitialized ? (
              <FlexLoader
                textProps={{
                  textSize:4,
                  fontWeight:2
                }}
                loaderProps={{
                  mb:3,
                  size:'40px'
                }}
                flexProps={{
                  minHeight:'50vh',
                  flexDirection:'column'
                }}
                text={'Loading contracts...'}
              />
            ) : (
              <Flex
                width={1}
                flexDirection={'column'}
              >
                <DashboardHeader
                  {...this.props}
                />
                {
                  PageComponent &&
                    <PageComponent
                      {...this.props}
                      match={{ params:{} }}
                      tokenConfig={this.props.tokenConfig}
                      selectedToken={this.props.selectedToken}
                      changeToken={this.changeToken.bind(this)}
                      selectedStrategy={this.state.selectedStrategy}
                      />
                }
              </Flex>
            )
          }
        </Flex>
      </Flex>
    );
  }
}

export default Dashboard;