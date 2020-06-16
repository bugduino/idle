import theme from '../theme';
import React, { Component } from 'react';
// import styles from './Dashboard.module.scss';
// import MenuAccount from '../MenuAccount/MenuAccount';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import { Flex, Box, Icon, Text, Image } from 'rimble-ui';

class DashboardMenu extends Component {
  state = {
    buyModalOpened:false
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

  setBuyModalOpened(buyModalOpened){
    this.setState({
      buyModalOpened
    });
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render() {
    if (!this.props.menu.length){
      return null;
    }

    return (
      <Flex
        p={0}
        flexDirection={['row','column']}
      >
        {
          !this.props.isMobile &&
            <Flex
              p={3}
              mb={3}
              flexDirection={'row'}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <RouterLink to="/">
                <Image
                  position={'relative'}
                  height={['35px','38px']}
                  src="images/logo-gradient.svg"
                />
              </RouterLink>
            </Flex>
        }
        {
        this.props.menu.map((menuLink,menuIndex) => (
          <Box
            my={[0,3]}
            key={`menu-${menuIndex}`}
            width={[1/this.props.menu.length,'auto']}
          >
            <RouterLink
              to={menuLink.route}
              style={{textDecoration:'none'}}
            >
              <Flex
                p={[2,3]}
                borderRadius={[0,2]}
                flexDirection={'row'}
                alignItems={'center'}
                backgroundColor={ menuLink.selected ? '#f3f6ff' : 'transparent' }
                boxShadow={menuLink.selected ? '0px 0px 0px 1px rgba(0,54,255,0.3)' : null}
              >
                <Flex
                  width={1}
                  alignItems={'center'}
                  flexDirection={['column','row']}
                  justifyContent={['center','flex-start']}
                >
                  {menuLink.image &&
                    <Image
                      mr={[0,3]}
                      ml={[0,2]}
                      mb={[1,0]}
                      align={'center'}
                      src={ menuLink.selected ? menuLink.image : (menuLink.imageInactive ? menuLink.imageInactive : menuLink.image)}
                      height={['1.2em','1.6em']}
                    />
                  }
                  {menuLink.icon &&
                    <Icon
                      mr={[0,3]}
                      ml={[0,2]}
                      mb={[1,0]}
                      align={'center'}
                      name={menuLink.icon}
                      size={ this.props.isMobile ? '1.4em' : '1.6em' }
                      color={ menuLink.selected ? menuLink.bgColor : 'copyColor' }
                    />
                  }
                  <Text
                    fontWeight={3}
                    fontSize={[0,2]}
                    color={'copyColor'}
                    textAlign={'center'}
                    style={{
                      whiteSpace:'nowrap'
                    }}
                  >
                    {menuLink.label}
                  </Text>
                </Flex>
                {
                  /*
                  menuLink.submenu.length>0 &&
                    <Flex width={1/4} justifyContent={'flex-end'}>
                      <Icon
                        mr={2}
                        size={'1rem'}
                        align={'right'}
                        name={ menuLink.selected ? 'KeyboardArrowDown' : 'KeyboardArrowRight' }
                        color={'copyColor'}
                      />
                    </Flex>
                  */
                }
              </Flex>
            </RouterLink>
            {
              /*
              menuLink.submenu.length>0 && (
                <Flex className={[styles.submenu]} style={{maxHeight:menuLink.selected ? menuLink.submenu.length*36+'px' : '0' }} flexDirection={'column'} borderLeft={ menuLink.selected ? '2px solid rgba(0,0,0,0.3)' : null }>
                  {
                    menuLink.submenu.map((submenuLink,submenuIndex) => {
                      return (
                        <RouterLink key={`submenu-${menuIndex}-${submenuIndex}`} to={`${menuLink.route}/${submenuLink.route}`} style={{textDecoration:'none'}}>
                          <Flex py={2} pl={'40px'} flexDirection={'row'} alignItems={'center'}>
                            <Text fontSize={'0.85rem'}>{submenuLink.label}</Text>
                          </Flex>
                        </RouterLink>
                      )
                    })
                  }
                </Flex>
              )
              */
            }
          </Box>
        ))
        }
        {
        /*
        !this.props.isMobile  &&
          <Box
            width={'auto'}
            borderTop={`1px solid ${theme.colors.divider}`}
          >
            <Flex
              p={[2,3]}
              style={{
                cursor:'pointer'
              }}
              borderRadius={[0,2]}
              flexDirection={'row'}
              alignItems={'center'}
              onClick={ e => this.setBuyModalOpened(true) }
            >
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={['column','row']}
                justifyContent={['center','flex-start']}
              >
                <Icon
                  mr={[0,3]}
                  ml={[0,2]}
                  mb={[1,0]}
                  size={'1.6em'}
                  align={'center'}
                  color={'copyColor'}
                  name={'AddCircleOutline'}
                />
                <Text
                  fontWeight={3}
                  fontSize={[0,2]}
                  color={'copyColor'}
                  textAlign={'center'}
                  style={{
                    whiteSpace:'nowrap'
                  }}
                >
                  Add Funds
                </Text>
              </Flex>
            </Flex>
          </Box>
        <BuyModal
          {...this.props}
          isOpen={this.state.buyModalOpened}
          closeModal={ e => this.setBuyModalOpened(false) }
        />
        */
        }
      </Flex>
    )
  }
}

export default DashboardMenu;