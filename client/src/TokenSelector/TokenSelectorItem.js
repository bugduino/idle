import React, { Component } from "react";
import { Image, Flex, Text, Icon } from 'rimble-ui';
import styles from './TokenSelector.module.scss';

class TokenSelectorItem extends Component {
  state = {
    opened: false
  };

  render() {
    return (
        <Flex className={styles.tokenSelectorItem} justifyContent={'flex-end'} width={'140px'} backgroundColor={'rgba(255,255,255,0.1)'} p={2} borderRadius={4} boxShadow={ this.props.isChild ? 0 : 1 } onClick={ this.props.handleClick ? (e) => { this.props.handleClick() } : null }>
          <Text color={ this.props.isChild ? 'dark-gray' : 'white' } fontWeight={2} fontSize={[2,3]}>{this.props.token}</Text>
          <Flex flexDirection={'row'} justifyContent={'stretch'} alignItems={'center'} ml={'8px'}>
            <Image src={`images/tokens/${this.props.token}.svg`} height={'32px'} ml={'2px'} />
            <Icon
              align={'center'}
              name={'KeyboardArrowDown'}
              color={'white'}
              size={"1.3em"}
            />
          </Flex>
        </Flex>
    );
  }
}
export default TokenSelectorItem;
