import React, { Component } from 'react';
import styles from './Dashboard.module.scss';
// import MenuAccount from '../MenuAccount/MenuAccount';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Box, Icon, Text, Image } from 'rimble-ui';

class DashboardMenu extends Component {
  state = {};

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

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render() {
    if (!this.props.menu.length){
      return null;
    }

    return (
      <Flex
        p={3}
        flexDirection={'column'}
      >
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
        {
        /*
        <MenuAccount {...this.props} />
        */
        }
        {
        this.props.menu.map((menuLink,menuIndex) => (
          <Box
            my={3}
            key={`menu-${menuIndex}`}
          >
            <RouterLink
              to={menuLink.route}
              style={{textDecoration:'none'}}
            >
              <Flex
                p={3}
                borderRadius={2}
                flexDirection={'row'}
                alignItems={'center'}
                backgroundColor={ menuLink.selected ? '#f3f6ff' : 'transparent' }
                boxShadow={menuLink.selected ? '0px 0px 4px 2px rgba(0,54,255,0.3)' : null}
              >
                <Flex
                  flexDirection={'row'}
                  alignItems={'center'}
                  justifyContent={'flex-start'}
                  width={ menuLink.submenu.length>0 ? 3/4 : 1}
                >
                  {menuLink.icon &&
                    <Icon
                      mr={3}
                      ml={2}
                      size={'1.6em'}
                      align={'center'}
                      name={menuLink.icon}
                      color={ menuLink.selected ? menuLink.bgColor : 'copyColor' }
                    />
                  }
                  <Text
                    fontSize={2}
                    fontWeight={3}
                    color={'copyColor'}
                  >
                    {menuLink.label}
                  </Text>
                </Flex>
                {
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
                }
              </Flex>
            </RouterLink>
            {
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
            }
          </Box>
        ))
        }
      </Flex>
    )
  }
}

export default DashboardMenu;