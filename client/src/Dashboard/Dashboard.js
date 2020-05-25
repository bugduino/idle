import React, { Component } from 'react';
import DashboardMenu from './DashboardMenu';
import { Flex, Card } from 'rimble-ui';
import FlexLoader from '../FlexLoader/FlexLoader';
import FunctionsUtil from '../utilities/FunctionsUtil';

// Import page components
import Stats from '../Stats/Stats';
import AssetPage from '../AssetPage/AssetPage';
import WelcomeModal from "../utilities/components/WelcomeModal";
import DashboardHeader from '../DashboardHeader/DashboardHeader';

class Dashboard extends Component {
  state = {
    menu:[],
    baseRoute:null,
    activeModal:null,
    currentRoute:null,
    pageComponent:null,
    currentSection:null,
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
    const baseRoute = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute']);
    const strategies = this.functionsUtil.getGlobalConfig(['strategies']);
    const menu = Object.keys(strategies).map(strategy => ({
        submenu:[],
        color:'#fff',
        selected:false,
        route:baseRoute+'/'+strategy,
        label:strategies[strategy].title,
        image:strategies[strategy].icon,
        imageInactive:strategies[strategy].iconInactive,
        bgColor:strategies[strategy].color,
        component:strategies[strategy].component
      })
    );

    menu.push(
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
    );

    await this.setState({
      menu
    });
  }

  resetModal = () => {
    this.setState({
      activeModal: null
    });
  }

  setActiveModal = (activeModal) => {
    this.setState({
      activeModal
    });
  }

  async loadParams() {
    const { match: { params } } = this.props;

    const baseRoute = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute']);
    let currentRoute = baseRoute;

    let pageComponent = null;
    let selectedToken = null;
    let currentSection = null;
    let selectedStrategy = null;

    // Set strategy
    if (params.section){

      currentSection = params.section;
      const param1 = params.param1;
      const param2 = params.param2;

      const section_is_strategy = Object.keys(this.props.availableStrategies).includes(currentSection.toLowerCase());
      const param1_is_strategy = param1 && Object.keys(this.props.availableStrategies).includes(param1.toLowerCase());

      if (section_is_strategy || param1_is_strategy){
        selectedStrategy = section_is_strategy ? currentSection : param1;
        currentRoute += '/'+selectedStrategy;

        // Set token
        const param1_is_token = param1 && Object.keys(this.props.availableStrategies[selectedStrategy]).includes(param1.toUpperCase());
        const param2_is_token = param2 && Object.keys(this.props.availableStrategies[selectedStrategy]).includes(param2.toUpperCase());
        if (param1_is_token || param2_is_token){
          selectedToken = param1_is_token ? param1.toUpperCase() : param2.toUpperCase();
          currentRoute += '/'+selectedToken;

          if (section_is_strategy){
            pageComponent = AssetPage;
          }
        }
      }
    }

    const menu = this.state.menu;

    menu.forEach(m => {
      m.selected = false;
      const sectionRoute = baseRoute+'/'+params.section;
      if (currentRoute.toLowerCase() === m.route.toLowerCase() || m.route.toLowerCase() === sectionRoute.toLowerCase()){
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

    // Exit if no strategy and token selected
    if (!pageComponent){
      return this.goToSection('/',false);
    }
    // console.log('currentSection',currentSection,'selectedStrategy',selectedStrategy,'selectedToken',selectedToken,'currentRoute',currentRoute);

    await this.props.setStrategy(selectedStrategy);
    await this.props.setToken(selectedToken);

    await this.setState({
      menu,
      params,
      baseRoute,
      currentRoute,
      pageComponent,
      currentSection
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
      await this.setState({
        pageComponent:null
      }, () => {
        this.loadParams();
      });
    }

    // Show welcome modal
    const accountChanged = prevProps.account !== this.props.account;
    if (this.props.account && accountChanged){
      let welcomeIsOpen = false;

      const welcomeModalProps = this.functionsUtil.getGlobalConfig(['modals','welcome']);

      if (welcomeModalProps.enabled && localStorage && accountChanged){

        // Check the last login of the wallet
        const currTime = new Date().getTime();
        const walletAddress = this.props.account.toLowerCase();
        let lastLogin = localStorage.getItem('lastLogin') ? JSON.parse(localStorage.getItem('lastLogin')) : {};

        if (!lastLogin[walletAddress]){
          lastLogin[walletAddress] = {
            'signedUp':false,
            'lastTime':currTime
          };
          welcomeIsOpen = true;
        } else if (!lastLogin[walletAddress].signedUp) {
          const lastTime = parseInt(lastLogin[walletAddress].lastTime);
          const timeFromLastLogin = (currTime-lastTime)/1000;
          welcomeIsOpen = timeFromLastLogin>=welcomeModalProps.frequency; // 1 day since last login
        }

        if (welcomeIsOpen){
          lastLogin[walletAddress].lastTime = currTime;
          this.functionsUtil.setLocalStorage('lastLogin',JSON.stringify(lastLogin));
        }
      }

      this.setState({
        activeModal: welcomeIsOpen ? 'welcome' : this.state.activeModal
      });
    }
  }

  goToSection(section,isDashboard=true){
    const newRoute = isDashboard ? this.state.baseRoute+'/'+section : section;
    window.location.hash=newRoute;
    window.scrollTo(0, 0);
  }

  changeToken(selectedToken){
    selectedToken = selectedToken.toUpperCase();
    if (Object.keys(this.props.availableTokens).includes(selectedToken)){
      const routeParts = [];

      // Add section
      if (this.state.currentSection.toLowerCase() !== this.props.selectedStrategy.toLowerCase()){
        routeParts.push(this.state.currentSection);
      }

      // Add strategy
      routeParts.push(this.props.selectedStrategy); 

      // Add token
      routeParts.push(selectedToken);

      this.goToSection(routeParts.join('/'));
    }
  }

  render() {
    const PageComponent = this.state.pageComponent ? this.state.pageComponent : null;
    return (
      <Flex
        width={'100%'}
        height={'100vh'}
        position={'fixed'}
        flexDirection={'row'}
        backgroundColor={['dashboardBg','white']}
      >
        <Flex
          bottom={0}
          zIndex={1}
          width={[1,1/6]}
          flexDirection={'column'}
          position={['fixed','relative']}
        >
          <Card
            p={[0,3]}
            width={['100vw','auto']}
            height={['auto','100vh']}
            >
            <DashboardMenu
              {...this.props}
              menu={this.state.menu}
            />
          </Card>
        </Flex>
        <Flex
          py={3}
          px={[3,5]}
          mb={['74px',0]}
          width={[1,5/6]}
          style={{
            overflowY:'scroll',
            overflowX:'hidden'
          }}
          flexDirection={'columns'}
          backgroundColor={'dashboardBg'}
        >
          {
            !this.props.accountInizialized || !this.props.contractsInitialized || !PageComponent ? (
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
                text={ !this.props.accountInizialized ? 'Loading account...' : ( !this.props.contractsInitialized ? 'Loading contracts...' : 'Loading assets...' )}
              />
            ) : (
              <Flex
                width={1}
                flexDirection={'column'}
              >
                <DashboardHeader
                  goToSection={this.goToSection.bind(this)}
                  {...this.props}
                />
                {
                  PageComponent &&
                    <PageComponent
                      {...this.props}
                      match={{ params:{} }}
                      changeToken={this.changeToken.bind(this)}
                      goToSection={this.goToSection.bind(this)}
                      />
                }
              </Flex>
            )
          }
        </Flex>

        <WelcomeModal
          closeModal={this.resetModal}
          account={this.props.account}
          simpleID={this.props.simpleID}
          network={this.props.network.current}
          tokenName={this.props.selectedToken}
          initSimpleID={this.props.initSimpleID}
          baseTokenName={this.props.selectedToken}
          isOpen={this.state.activeModal === 'welcome'}
        />
      </Flex>
    );
  }
}

export default Dashboard;