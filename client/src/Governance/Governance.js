import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Card, Icon, Text } from 'rimble-ui';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardMenu from '../DashboardMenu/DashboardMenu';

// Import page components
import Overview from '../Governance/Overview';
import Proposals from '../Governance/Proposals';
import Leaderboard from '../Governance/Leaderboard';
import RoundButton from '../RoundButton/RoundButton';
import DashboardCard from '../DashboardCard/DashboardCard';
import TooltipModal from "../utilities/components/TooltipModal";
import DashboardHeader from '../DashboardHeader/DashboardHeader';

class Dashboard extends Component {
  state = {
    menu:[],
    baseRoute:null,
    modalTitle:null,
    activeModal:null,
    currentRoute:null,
    modalContent:null,
    pageComponent:null,
    currentSection:null,
    selectedSection:null,
    selectedSubsection:null,
  };

  timeoutId = null;

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
    const menu = [];
    const baseRoute = this.functionsUtil.getGlobalConfig(['governance','baseRoute']);

    // Add Proposals
    menu.push(
      {
        selected:true,
        route:baseRoute,
        icon:'Dashboard',
        label:'Overview',
        color:'dark-gray',
        component:Overview,
        bgColor:this.props.theme.colors.primary,
        submenu:[]
      }
    );

    // Add Proposals
    menu.push(
      {
        selected:false,
        label:'Proposals',
        bgColor:'#00acff',
        color:'dark-gray',
        icon:'LightbulbOutline',
        component:Proposals,
        route:`${baseRoute}/proposals`,
        submenu:[]
      }
    );

    // Add tools
    menu.push(
      {
        selected:false,
        bgColor:'#ff0000',
        color:'dark-gray',
        label:'Leaderboard',
        component:Leaderboard,
        icon:'FormatListNumbered',
        route:`${baseRoute}/leaderboard`,
        submenu:[]
      }
    );

    await this.setState({
      menu,
      baseRoute
    });
  }

  resetModal = () => {
    this.setState({
      activeModal: null
    });
  }

  openTooltipModal = (modalTitle,modalContent) => {
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'UI',
      eventAction: modalTitle,
      eventLabel: 'TooltipModal'
    });

    this.setState({
      modalTitle,
      modalContent
    },() => {
      this.setActiveModal('tooltip');
    })
  }

  setActiveModal = (activeModal) => {
    this.setState({
      activeModal
    });
  }

  async loadParams() {
    const { match: { params } } = this.props;

    const baseRoute = this.state.baseRoute;
    const currentRoute = window.location.hash.substr(1);

    let pageComponent = null;
    let currentSection = null;

    const menu = this.state.menu;

    let selectedSection = null;
    let selectedSubsection = null;

    menu.forEach( m => {
      m.selected = false;
      const sectionRoute = baseRoute+'/'+params.section;
      if (currentRoute.toLowerCase() === m.route.toLowerCase() || ( !m.submenu.length && m.route.toLowerCase() === sectionRoute.toLowerCase() )){
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

          // Set selected subsection
          if (subm.selected){
            selectedSubsection = subm;
          }

        });
      }

      // Set selected section
      if (m.selected){
        selectedSection = m;
      }
    });

    // console.log('pageComponent',params,pageComponent);

    // Exit if no strategy and token selected
    if (!pageComponent){
      return this.goToSection('/',false);
    }

    await this.setState({
      menu,
      params,
      baseRoute,
      currentRoute,
      pageComponent,
      currentSection,
      selectedSection,
      selectedSubsection
    });
  }

  componentWillUnmount(){
    if (this.timeoutId){
      window.clearTimeout(this.timeoutId);
    }
  }

  async componentWillMount() {
    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  async componentDidMount() {
    this.timeoutId = window.setTimeout(() => {
      if (!this.props.accountInizialized || !this.props.contractsInitialized){
        this.setState({
          showResetButton:true
        });
      }
    },20000);

    if (!this.props.web3){
      return this.props.initWeb3();
    } else if (!this.props.accountInizialized){
      return this.props.initAccount();
    } else if (!this.props.contractsInitialized){
      return this.props.initializeContracts();
    }

    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
  }

  async componentDidUpdate(prevProps,prevState) {

    this.loadUtils();

    const prevParams = prevProps.match.params;
    const params = this.props.match.params;

    if (JSON.stringify(prevParams) !== JSON.stringify(params)){
      await this.setState({
        pageComponent:null
      }, () => {
        this.loadParams();
      });
    }

    const accountChanged = prevProps.account !== this.props.account;
    const strategyChanged = this.props.selectedStrategy && prevProps.selectedStrategy !== this.props.selectedStrategy;
    const accountInizialized = this.props.accountInizialized && prevProps.accountInizialized !== this.props.accountInizialized;
    const contractsInitialized = this.props.contractsInitialized && prevProps.contractsInitialized !== this.props.contractsInitialized;

    if (accountChanged || accountInizialized || contractsInitialized || strategyChanged){
      // this.checkModals();
    }
  }

  goToSection(section,isGovernance=true){

    // Remove dashboard route
    if (isGovernance){
      section = section.replace(this.state.baseRoute +'/','');
    }

    const newRoute = isGovernance ? this.state.baseRoute +'/' + section : section;
    window.location.hash = newRoute;

    // Send GA event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'UI',
      eventAction: 'goToSection',
      eventLabel: newRoute
    });

    window.scrollTo(0, 0);
  }

  logout = async () => {
    this.props.setConnector('Infura','Infura');
    await this.props.initWeb3('Infura');
  }

  render() {
    const PageComponent = this.state.pageComponent ? this.state.pageComponent : null;
    return (
      <Flex
        width={'100%'}
        position={'fixed'}
        flexDirection={'row'}
        height={[(window.innerHeight-61)+'px','100vh']}
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
          mb={0}
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
              <Flex
                width={1}
                minHeight={'50vg'}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                {
                  !this.state.showResetButton ? (
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
                        my:3,
                        flexDirection:'column'
                      }}
                      text={ !this.props.accountInizialized ? 'Loading account...' : ( !this.props.contractsInitialized ? 'Loading contracts...' : 'Loading assets...' )}
                    />
                  ) : (
                    <DashboardCard
                      cardProps={{
                        p:3,
                        mt:3,
                        width:[1,0.35]
                      }}
                    >
                      <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                      >
                        <Icon
                          size={'2.3em'}
                          name={'Warning'}
                          color={'cellText'}
                        />
                        <Text
                          mt={2}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'center'}
                        >
                          Idle can't connect to your wallet!<br />Make sure that your wallet is unlocked and try again.
                        </Text>
                        <RoundButton
                          buttonProps={{
                            mt:3,
                            width:[1,1/2]
                          }}
                          handleClick={this.logout.bind(this)}
                        >
                          Logout
                        </RoundButton>
                      </Flex>
                    </DashboardCard>
                  )
                }
              </Flex>
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
                      urlParams={this.state.params}
                      goToSection={this.goToSection.bind(this)}
                      selectedSection={this.state.selectedSection}
                      selectedSubsection={this.state.selectedSubsection}
                      openTooltipModal={this.openTooltipModal.bind(this)}
                      />
                }
              </Flex>
            )
          }
        </Flex>
        <TooltipModal
          closeModal={this.resetModal}
          title={this.state.modalTitle}
          content={this.state.modalContent}
          isOpen={this.state.activeModal === 'tooltip'}
        >
        </TooltipModal>
      </Flex>
    );
  }
}

export default Dashboard;