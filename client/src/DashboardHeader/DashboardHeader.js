import theme from '../theme';
import ExtLink from '../ExtLink/ExtLink';
import React, { Component } from 'react';
import MenuAccount from '../MenuAccount/MenuAccount';
import RoundButton from '../RoundButton/RoundButton';
import GovModal from "../utilities/components/GovModal";
import GovernanceUtil from '../utilities/GovernanceUtil';
import { Box, Flex, Text, Icon, Button } from "rimble-ui";
import DelegateVesting from '../DelegateVesting/DelegateVesting';

class DashboardHeader extends Component {

  state = {
    unclaimed:null,
    vestingAmount:null,
    govModalOpened:false
  }

  // Utils
  idleGovToken = null;
  functionsUtil = null;
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }

    this.functionsUtil = this.governanceUtil.functionsUtil;
    this.idleGovToken = this.functionsUtil.getIdleGovToken();
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  async loadData(){
    const idleGovTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']);
    if (idleGovTokenEnabled && this.props.account){
      const unclaimed = await this.idleGovToken.getUnclaimedTokens(this.props.account);
      return this.setState({
        unclaimed
      });
    }
    return null;
  }

  setConnector = async (connectorName) => {
    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventAction: 'logout',
      eventCategory: 'Connect'
    });

    if (typeof this.props.setConnector === 'function'){
      this.props.setConnector(connectorName);
    }

    return await this.props.context.setConnector(connectorName);
  }

  async exit(){
    this.props.goToSection('/',false);
  }

  setGovModal(govModalOpened){
    this.setState({
      govModalOpened
    });
  }

  render() {
    const isDashboard = this.props.isDashboard;
    const isGovernance = this.props.isGovernance;
    const governanceRoute = this.functionsUtil.getGlobalConfig(['governance','baseRoute']);
    const governanceEnabled = this.functionsUtil.getGlobalConfig(['governance','enabled']);
    const dashboardRoute = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute'])+'/'+Object.keys(this.props.availableStrategies)[0];
    return (
      <Box
        mb={3}
      >
        <Flex
          pb={2}
          width={1}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={['flex-end','center']}
          borderBottom={`1px solid ${theme.colors.divider}`}
        >
          <MenuAccount
            {...this.props}
            setGovModal={this.setGovModal.bind(this)}
          />
          <Flex
            mr={2}
            flexDirection={['column','row']}
            alignItems={['flex-end','center']}
          >
            {
              governanceEnabled && isDashboard ? (
                <RoundButton
                  buttonProps={{
                    mainColor:'redeem',
                    size:this.props.isMobile ? 'small' : 'medium'
                  }}
                  handleClick={ (e) => { this.props.goToSection(governanceRoute,false) } }
                >
                  <Flex
                    alignItems={'center'}
                    flexDirection={'row'}
                  >
                    <Icon
                      mr={[1,2]}
                      size={'1.6em'}
                      color={'white'}
                      name={'ExitToApp'}
                    />
                    <Text
                      fontWeight={3}
                      color={'white'}
                      fontSize={[2,3]}
                    >
                      Governance
                    </Text>
                  </Flex>
                </RoundButton>
              ) : isGovernance && (
                <RoundButton
                  buttonProps={{
                    mainColor:'redeem',
                    size:this.props.isMobile ? 'small' : 'medium'
                  }}
                  handleClick={ (e) => { this.props.goToSection(dashboardRoute,false) } }
                >
                  <Flex
                    alignItems={'center'}
                    flexDirection={'row'}
                  >
                    <Icon
                      mr={[1,2]}
                      size={'1.6em'}
                      color={'white'}
                      name={'ExitToApp'}
                    />
                    <Text
                      fontWeight={3}
                      color={'white'}
                      fontSize={[2,3]}
                    >
                      Dashboard
                    </Text>
                  </Flex>
                </RoundButton>
              )
            }
            {
              /*
              <Link
                display={'flex'}
                onClick={ (e) => { this.exit() } }
                style={{
                  alignItems:'center',
                  justifyContent:['flex-end','space-between']
                }}
              >
                <Icon
                  mr={2}
                  size={'1.6em'}
                  name={'ExitToApp'}
                  color={'copyColor'}
                />
                <Text
                  fontSize={2}
                  fontWeight={3}
                  color={'copyColor'}
                >
                  Exit
                </Text>
              </Link>
              */
            }
          </Flex>
        </Flex>
        {
          this.state.unclaimed && this.state.unclaimed.gt(0) &&
            <Flex
              p={2}
              mt={3}
              width={1}
              borderRadius={1}
              alignItems={'center'}
              justifyContent={'center'}
              backgroundColor={'#f3f6ff'}
              flexDirection={['column','row']}
              boxShadow={'0px 0px 0px 1px rgba(0,54,255,0.3)'}
            >
              <Text
                fontWeight={500}
                color={'#3f4e9a'}
                fontSize={'15px'}
                textAlign={'center'}
              >
                IDLE Governance Token is now available, 
                <ExtLink
                  ml={1}
                  fontWeight={500}
                  color={'primary'}
                  fontSize={'15px'}
                  hoverColor={'primary'}
                  href={'https://idlefinance.medium.com/idle-governance-is-live-9b55e8f407d7'}
                >
                  discover more
                </ExtLink>! You have {this.state.unclaimed.toFixed(4)} IDLE tokens to claim.
              </Text>
              <Button
                ml={[0,2]}
                mt={[2,0]}
                size={'small'}
                onClick={ e => this.setGovModal(true) }
              >
                CLAIM NOW
              </Button>
            </Flex>
        }
        {
          this.props.isGovernance && 
            <DelegateVesting
              {...this.props}
            />
        }
        <GovModal
          {...this.props}
          isOpen={this.state.govModalOpened}
          claimCallback={this.loadData.bind(this)}
          closeModal={e => this.setGovModal(false) }
        />
      </Box>
    );
  }
}

export default DashboardHeader;
