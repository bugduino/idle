import React, { Component } from "react";
import { Flex, Icon, Link } from 'rimble-ui';
import styles from './ButtonGroup.module.scss';

class ButtonGroup extends Component {
  state = {
    opened:false
  };

  toggleOpen = () => {
    this.setState({
      opened: this.state.opened ? false : true
    });
  }

  render() {

    let iconColor = 'white';
    if (this.props.theme === 'light'){
      iconColor = 'dark-gray';
    }

    return (
      <Flex flexDirection={'column'}>
        {
          this.props.isMobile && (
            <Flex
              position={'relative'}
              flexDirection={'row'}
              width={'48px'}
              height={'48px'}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Link onClick={ e => this.toggleOpen() }>
                <Icon
                  align={'center'}
                  name={ this.state.opened ? 'Close' : 'Menu'}
                  color={ iconColor ? iconColor : 'white'}
                  size={"2em"}
                />
              </Link>
            </Flex>
          )
        }
        {
          (!this.props.isMobile || this.state.opened) &&
            <Flex
              className={[styles.buttonGroup,styles[this.props.theme]]}
              position={['absolute','relative']}
              flexDirection={['column','row']}
              px={['3%',0]}
              pb={['3%',0]}
              left={[0,'init']}
              width={['100%','auto']}
              height={['auto','auto']}
              minWidth={'100px'}
              alignItems={'center'}
              justifyContent={['flex-start','flex-end']}
              borderRadius={[2,4]}
            >
              {
                this.props.components.map((c,i) => {
                  const isFirstItem = i===0;
                  const isLastItem = i===this.props.components.length-1;
                  const Component = c.component;

                  // Merge style
                  let style = !this.props.isMobile ? {flex:'1 1 0px'} : {};
                  if (c.style){
                    style = Object.assign(style,c.style);
                  }

                  return (
                      <Component key={'component_'+i} isMobile={this.props.isMobile} borderRight={  !this.props.isMobile && isFirstItem && !isLastItem ? '1px solid rgba(255,255,255,0.1)' : null } borderLeft={ !this.props.isMobile && (isLastItem && this.props.components.length>2 ) && !isFirstItem ? '1px solid rgba(255,255,255,0.1)' : null } boxShadow={'none'} borderRadius={ this.props.isMobile ? '8px' : (isFirstItem && !isLastItem ? '2rem 0 0 2rem' : ( !this.props.isMobile && isLastItem && !isFirstItem ? '0 2rem 2rem 0' : ( !this.props.isMobile && isLastItem && isFirstItem ? '2rem' : '0') )) } style={ style } className={styles.buttonGroupComponent} {...c.props}>{ c.value ? c.value : null }</Component>
                  );
                })
              }
            </Flex>
        }
      </Flex>
    );
  }
}
export default ButtonGroup;
