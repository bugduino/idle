import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Card, Icon, Text } from 'rimble-ui';
import GovernanceUtil from '../utilities/GovernanceUtil';
import DashboardMenu from '../DashboardMenu/DashboardMenu';

// Import page components
import Overview from './Overview';
import Delegate from './Delegate';
import Proposals from './Proposals';
import Leaderboard from './Leaderboard';
import RoundButton from '../RoundButton/RoundButton';
import DashboardCard from '../DashboardCard/DashboardCard';
import TooltipModal from "../utilities/components/TooltipModal";
import DashboardHeader from '../DashboardHeader/DashboardHeader';

class Dashboard extends Component {
  state = {
    menu:[],
    votes:null,
    balance:null,
    baseRoute:null,
    modalTitle:null,
    activeModal:null,
    currentRoute:null,
    modalContent:null,
    pageComponent:null,
    currentSection:null,
    selectedSection:null,
    currentDelegate:null,
    proposalThreshold:null,
    selectedSubsection:null,
    proposalMaxOperations:null
  };

  timeoutId = null;

  // Utils
  functionsUtil = null;
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }

    window.governanceUtil = this.governanceUtil;
    window.functionsUtil = this.functionsUtil = this.governanceUtil.functionsUtil;
  }

  async loadMenu() {
    const menu = [];
    const baseRoute = this.functionsUtil.getGlobalConfig(['governance','baseRoute']);

    // Add Proposals
    menu.push(
      {
        submenu:[],
        selected:true,
        route:baseRoute,
        icon:'Dashboard',
        label:'Overview',
        color:'dark-gray',
        component:Overview,
        bgColor:this.props.theme.colors.primary,
      }
    );

    // Add Proposals
    menu.push(
      {
        submenu:[],
        selected:false,
        label:'Proposals',
        bgColor:'#00acff',
        color:'dark-gray',
        icon:'LightbulbOutline',
        component:Proposals,
        route:`${baseRoute}/proposals`,
      }
    );

    // Add tools
    menu.push(
      {
        submenu:[],
        selected:false,
        bgColor:'#ff0000',
        color:'dark-gray',
        label:'Leaderboard',
        component:Leaderboard,
        icon:'FormatListNumbered',
        route:`${baseRoute}/leaderboard`,
      }
    );

    // Add tools
    menu.push(
      {
        submenu:[],
        selected:false,
        label:'Delegate',
        color:'dark-gray',
        bgColor:'#ff0000',
        component:Delegate,
        icon:'CompareArrows',
        route:`${baseRoute}/delegate`,
      }
    );

    // Add tools
    menu.push(
      {
        submenu:[],
        icon:'Forum',
        mobile:false,
        label:'Forum',
        selected:false,
        component:null,
        color:'dark-gray',
        bgColor:'#ff0000',
        isExternalLink:true,
        route:`https://gov.idle.finance`,
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

    // const governanceEnabled = this.functionsUtil.getGlobalConfig(['governance','enabled']);
    // if (!governanceEnabled){
    //   this.goToSection('/',false);
    // }

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

    /*
    if (!this.props.web3){
      return this.props.initWeb3();
    } else if (!this.props.accountInizialized){
      return this.props.initAccount();
    } else if (!this.props.contractsInitialized){
      return this.props.initializeContracts();
    }
    */

    this.loadUtils();
    await this.loadMenu();
    this.loadParams();
    this.loadData();
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
    const accountInizialized = this.props.accountInizialized && prevProps.accountInizialized !== this.props.accountInizialized;
    const contractsInitialized = this.props.contractsInitialized && prevProps.contractsInitialized !== this.props.contractsInitialized;

    if (accountChanged || accountInizialized || contractsInitialized){
      this.loadData();
    }
  }

  goToSection(section,isGovernance=true){

    // Remove dashboard route
    if (isGovernance){
      section = section.replace(this.state.baseRoute+'/','');
    }

    const newRoute = (isGovernance ? this.state.baseRoute+(section.length>0 ? '/'+section : '') : section).replace(/[/]+$/,'');
    window.location.hash = newRoute;

    // Send GA event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'UI',
      eventLabel: newRoute,
      eventAction: 'goToSection'
    });

    window.scrollTo(0, 0);
  }

  async loadData(){
    if (this.props.account){
      const [
        {
          proposalThreshold, proposalMaxOperations
        },
        votes,
        balance,
        currentDelegate
      ] = await Promise.all([
        this.governanceUtil.getProposalParams(),
        this.governanceUtil.getCurrentVotes(this.props.account),
        this.governanceUtil.getTokensBalance(this.props.account),
        this.governanceUtil.getCurrentDelegate(this.props.account)
      ]);

      this.setState({
        votes,
        balance,
        currentDelegate,
        proposalThreshold,
        proposalMaxOperations
      });
    }
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
                      votes={this.state.votes}
                      balance={this.state.balance}
                      urlParams={this.state.params}
                      loadUserData={this.loadData.bind(this)}
                      goToSection={this.goToSection.bind(this)}
                      currentDelegate={this.state.currentDelegate}
                      selectedSection={this.state.selectedSection}
                      proposalThreshold={this.state.proposalThreshold}
                      selectedSubsection={this.state.selectedSubsection}
                      openTooltipModal={this.openTooltipModal.bind(this)}
                      proposalMaxOperations={this.state.proposalMaxOperations}
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