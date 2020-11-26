import React from "react";
import ExtLink from '../../ExtLink/ExtLink';
import FunctionsUtil from '../FunctionsUtil';
import { Box, Flex, Image, Text, Link, Icon } from "rimble-ui";

import {
  Link as RouterLink
} from "react-router-dom";

class Header extends React.Component {
  state = {

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

  async componentWillMount() {
    this.loadUtils();
  }

  async componentDidMount() {

    this.loadUtils();
  }

  async componentDidUpdate(prevProps, prevState) {

    this.loadUtils();

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }
  }

  render() {

    const governanceEnabled = this.functionsUtil.getGlobalConfig(['governance','enabled']);

    return (
      <Box
        style={{
          left: '0',
          right: '0',
          zIndex: 99,
          position: 'absolute',
        }}
      >
        <Flex
          p={2}
          alignItems={'center'}
          justifyContent={'center'}
          backgroundColor={'dark-blue'}
          flexDirection={['column','row']}
        >
          <Text
            color={'white'}
            textAlign={'center'}
          >
            IDLE Governance Token is now live!
          </Text>
          <ExtLink
            pr={2}
            py={1}
            mt={[1,0]}
            ml={[0,2]}
            pl={'12px'}
            color={'white'}
            style={{
              display:'flex',
              borderRadius:'8px',
              flexDirection:'row',
              alignItems:'flex-end'
            }}
            backgroundColor={'#0037ff'}
            href={'https://idlefinance.medium.com/idle-governance-is-live-9b55e8f407d7'}
          >
            Read More
            <Icon
              ml={1}
              size={'1.3em'}
              color={'white'}
              name={'KeyboardArrowRight'}
            >
            </Icon>
          </ExtLink>
        </Flex>
        <Flex
          pt={[3,4]}
          mx={'auto'}
          bg={"transparent"}
          width={['98%','100%']}
          maxWidth={['100%','100em']}
          alignItems={['center','flex-start']}
        >
          <Flex
            ml={[3, 5]}
            width={[0.5, 3/12]}
          >
            <RouterLink
              to="/"
            >
              <Image
                position={'relative'}
                src={'images/logo.svg'}
                height={['35px','48px']}
              />
            </RouterLink>
          </Flex>
            <Flex
              width={[0.5,8/12]}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={"flex-end"}
            >
              {
                governanceEnabled && 
                  <Link
                    mr={4}
                    fontSize={3}
                    color={'white'}
                    hoverColor={'white'}
                    fontFamily={'sansSerif'}
                    textAlign={['center','left']}
                    onClick={ (e) => window.location.hash='#/governance' }
                  >
                    Governance
                  </Link>
              }
              {
                !this.props.isMobile &&
                  <>
                    <Link
                      mr={4}
                      fontSize={3}
                      color={'white'}
                      hoverColor={'white'}
                      fontFamily={'sansSerif'}
                      textAlign={['center','left']}
                      onClick={(e) => {this.functionsUtil.scrollTo(document.getElementById('contacts').offsetTop,300)}}
                    >
                      Contact Us
                    </Link>
                    <Link
                      fontSize={3}
                      color={'white'}
                      hoverColor={'white'}
                      fontFamily={'sansSerif'}
                      textAlign={['center','left']}
                      onClick={(e) => {this.functionsUtil.scrollTo(document.getElementById('faq').offsetTop,300)}}
                    >
                      FAQs
                    </Link>
                  </>
              }
            </Flex>
        </Flex>
      </Box>
    );
  }
}

export default Header;
