import React, { Component } from "react";
import { Image, Flex, Text, Icon, Button } from 'rimble-ui';
import styles from './TokenSelector.module.scss';

class TokenSelectorItem extends Component {
  state = {
    opened: false
  };

  render() {

    let fontSize = 2;
    let imageHeight = '24px';

    if (this.props.size === 'big'){
      fontSize = 3;
      imageHeight = '28px';
    }

    return (
        <Button className={ this.props.isMobile && !this.props.isChild ? [styles.tokenSelectorItem,styles.isMobile] : styles.tokenSelectorItem  } boxShadow={'none'} mainColor={'transparent'} color={'transparent'} width={ this.props.isMobile ? '100%' : '140px'} p={2} borderRadius={this.props.borderRadius} onClick={ this.props.handleClick ? (e) => { this.props.handleClick() } : null }>
          {
            this.props.disabled &&
              <Text.span className={styles.comingSoon}>COMING SOON</Text.span>
          }
          <Flex opacity={ this.props.disabled ? '0.5' : '1' }>
            <Text color={ this.props.isChild && !this.props.isMobile ? 'dark-gray' : ( this.props.disabled ? '#666666' : ( this.props.color ? this.props.color : 'white' )) } fontWeight={4} fontSize={[2,fontSize]} lineHeight={'32px'}>{this.props.token}</Text>
            <Flex flexDirection={'row'} justifyContent={'stretch'} alignItems={'center'} ml={'8px'}>
              <Image src={`images/tokens/${this.props.token}.svg`} height={imageHeight} ml={'2px'} />
              {
                (!this.props.isMobile || !this.props.isChild) && 
                  <Icon
                    align={'center'}
                    name={'KeyboardArrowDown'}
                    color={ this.props.isChild ? 'white' : (this.props.color ? this.props.color : 'white') }
                    size={"1.3em"}
                  />
              }
            </Flex>
          </Flex>
        </Button>
    );
  }
}
export default TokenSelectorItem;
