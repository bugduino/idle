import React, { Component } from "react";
import { Image, Flex, Text, Icon, Button } from 'rimble-ui';
import styles from './TokenSelector.module.scss';

class TokenSelectorItem extends Component {
  state = {
    opened: false
  };

  render() {
    return (
        <Button className={styles.tokenSelectorItem} boxShadow={'none'} mainColor={'transparent'} color={'transparent'} width={'140px'} p={2} borderRadius={this.props.borderRadius} onClick={ this.props.handleClick ? (e) => { this.props.handleClick() } : null }>
          {
            this.props.disabled &&
              <Text.span className={styles.comingSoon}>COMING SOON</Text.span>
          }
          <Flex opacity={ this.props.disabled ? '0.5' : '1' }>
            <Text color={ this.props.isChild ? 'dark-gray' : ( this.props.disabled ? '#666666' : 'white') } fontWeight={4} fontSize={[2,2]} lineHeight={'32px'}>{this.props.token}</Text>
            <Flex flexDirection={'row'} justifyContent={'stretch'} alignItems={'center'} ml={'8px'}>
              <Image src={`images/tokens/${this.props.token}.svg`} height={'24px'} ml={'2px'} />
              <Icon
                align={'center'}
                name={'KeyboardArrowDown'}
                color={'white'}
                size={"1.3em"}
              />
            </Flex>
          </Flex>
        </Button>
    );
  }
}
export default TokenSelectorItem;
