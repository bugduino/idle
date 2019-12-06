import React, { Component } from "react";
import { Flex } from 'rimble-ui';
import styles from './TokenSelector.module.scss';
import TokenSelectorItem from './TokenSelectorItem.js';

class TokenSelector extends Component {
  state = {
    opened: false
  };

  toggleOpen(){
    this.setState({
      opened:!this.state.opened
    })
  }

  handleSelector(opened){
    this.setState({
      opened
    });
  }


  selectToken(token,tokenInfo){
    if (tokenInfo.enabled){
      this.toggleOpen();
      this.props.setSelectedToken(token);
      return true;
    }
    return false;
  }

  render() {

    const tokens = Object.keys(this.props.availableTokens).map((token,i) => {
                      if (token !== this.props.selectedToken){
                        const tokenInfo = this.props.availableTokens[token];
                        const tokenEnabled = tokenInfo.enabled;
                        return (
                          <TokenSelectorItem disabled={!tokenEnabled} key={'token_selector_'+token} borderRadius={4} isChild={true} token={token} handleClick={ e => {this.selectToken(token,tokenInfo) }} />
                        );
                      }
                      return null;
                    });

    return (
        <Flex
          position={'relative'}
          flexDirection={'column'}
          width={['90%','auto']}
          alignItems={'center'}
          justifyContent={'flex-end'}
          /*mr={3}*/
          /*p={2}*/
          onMouseEnter={ e => {this.handleSelector(true)} }
          onMouseLeave={ e => {this.handleSelector(false)} }
          borderRadius={this.props.borderRadius}
          borderLeft={this.props.borderLeft}
          borderRight={this.props.borderRight}
          >
            <TokenSelectorItem borderRadius={this.props.borderRadius} disabled={false} token={this.props.selectedToken} />
            <Flex flexDirection={'column'} borderRadius={4} backgroundColor={'white'} overflow={'hidden'} className={[styles.selectorCurtain,this.state.opened ? styles.opened : null]} position={'absolute'} top={'100%'}>
              { tokens }
            </Flex>
        </Flex>
    );
  }
}
export default TokenSelector;
