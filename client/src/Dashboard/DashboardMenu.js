import React, { Component } from 'react';
import styles from './Dashboard.module.scss';
import { Flex, Box, Icon, Text } from 'rimble-ui';
import { Link as RouterLink } from "react-router-dom";

class DashboardMenu extends Component {
  state = {};

  render() {
    if (!this.props.menu.length){
      return null;
    }
    return this.props.menu.map((menuLink,menuIndex) => (
      <Box key={`menu-${menuIndex}`}>
        <RouterLink to={menuLink.route} style={{textDecoration:'none'}}>
          <Flex p={3} flexDirection={'row'} alignItems={'center'} borderLeft={menuLink.selected ? '2px solid rgba(0,0,0,0.3)' : null} backgroundColor={menuLink.selected ? menuLink.bgColor : null}>
            <Flex flexDirection={'row'} width={ menuLink.submenu.length>0 ? 3/4 : 1}>
              {menuLink.icon &&
                <Icon
                  mr={2}
                  size={'1.2rem'}
                  align={'center'}
                  name={menuLink.icon}
                  color={menuLink.selected ? menuLink.color : 'dark-gray'}
                />
              }
              <Text
                fontSize={'0.90rem'}
                fontWeight={menuLink.selected ? 500 : 400}
                color={menuLink.selected ? menuLink.color : 'dark-gray'}
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
                    color={menuLink.selected ? menuLink.color : 'dark-gray'}
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
}

export default DashboardMenu;