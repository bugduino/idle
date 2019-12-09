import React, { Component } from "react";
import { Flex } from 'rimble-ui';
import styles from './ButtonGroup.module.scss';

class ButtonGroup extends Component {
  state = {

  };

  render() {
    return (
        <Flex
          className={styles.buttonGroup}
          position={'relative'}
          flexDirection={'row'}
          width={['90%','auto']}
          minWidth={'100px'}
          alignItems={'center'}
          justifyContent={'flex-end'}
          borderRadius={4}
        >
          {
            this.props.components.map((c,i) => {
              const isFirstItem = i===0;
              const isLastItem = i===this.props.components.length-1;
              const Component = c.component;
              return (
                  <Component key={'component_'+i} borderRight={ isFirstItem && !isLastItem ? '1px solid rgba(255,255,255,0.1)' : null } borderLeft={ isLastItem && !isFirstItem ? '1px solid rgba(255,255,255,0.1)' : null } boxShadow={'none'} borderRadius={ isFirstItem && !isLastItem ? '2rem 0 0 2rem' : ( isLastItem && !isFirstItem ? '0 2rem 2rem 0' : ( isLastItem && isFirstItem ? '2rem' : '0') ) } style={{flex:'1 1 0px'}} className={styles.buttonGroupComponent} {...c.props}>{ c.value ? c.value : null }</Component>
              );
            })
          }
        </Flex>
    );
  }
}
export default ButtonGroup;
