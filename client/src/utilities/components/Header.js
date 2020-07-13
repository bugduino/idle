import React from "react";
import FunctionsUtil from '../FunctionsUtil';
import { Box, Flex, Image, Link } from "rimble-ui";

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
          pt={[3,4]}
          mx={'auto'}
          bg={"transparent"}
          width={['98%','100%']}
          maxWidth={[1,'100em']}
          alignItems={['center','flex-start']}
        >
          <Flex
            ml={[3, 5]}
            width={[1, 3/12]}
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
          {
            !this.props.isMobile &&
              <Flex
                width={[1,8/12]}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={"flex-end"}
              >
                <Link
                  fontSize={3}
                  color={'white'}
                  hoverColor={'white'}
                  fontFamily={'sansSerif'}
                  textAlign={['center','left']}
                  onClick={(e) => {this.functionsUtil.scrollTo(document.getElementById('contacts').offsetTop,300)}}
                >Contact Us</Link>
                <Link
                  ml={4}
                  fontSize={3}
                  color={'white'}
                  hoverColor={'white'}
                  fontFamily={'sansSerif'}
                  textAlign={['center','left']}
                  onClick={(e) => {this.functionsUtil.scrollTo(document.getElementById('faq').offsetTop,300)}}
                >FAQs</Link>
              </Flex>
          }
        </Flex>
      </Box>
    );
  }
}

export default Header;
