import theme from '../theme';
import React, { Component } from 'react';
// import styles from './DashboardHeader.module.scss';
import MenuAccount from '../MenuAccount/MenuAccount';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Box, Flex, Text, Icon, Link } from "rimble-ui";
// import ButtonLoader from '../ButtonLoader/ButtonLoader';
// import DashboardCard from '../DashboardCard/DashboardCard';
// import AccountOverview from "../utilities/components/AccountOverview";

class DashboardHeader extends Component {

  state = {}

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
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

  render() {

    // const buttonSize = this.props.isMobile ? 'small' : 'medium';
    return (
      <Box
        pb={2}
        mb={3}
        borderBottom={`1px solid ${theme.colors.divider}`}
      >
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'space-between'}
        >
          <MenuAccount
            p={0}
            {...this.props}
          />
          {
            <Link
              pr={2}
              display={'flex'}
              onClick={ (e) => { this.exit() } }
              style={{alignItems:'center',justifyContent:'space-between'}}
            >
              <Icon
                mr={2}
                size={'1.8em'}
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
          }
        </Flex>
      </Box>
    );
  }
}

export default DashboardHeader;
