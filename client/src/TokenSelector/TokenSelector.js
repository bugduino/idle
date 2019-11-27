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

  selectToken(token){
    if (token.enabled){
      this.props.setSelectedToken(token);
      this.toggleOpen();
      return true;
    }
    return false;
  }

  render() {

    const tokens = Object.keys(this.props.availableTokens).map((token,i) => {
                      if (token !== this.props.selectedToken){
                        const tokenEnabled = token.enabled;
                        return (
                          <TokenSelectorItem disabled={!tokenEnabled} key={'token_selector_'+token} isChild={true} token={token} handleClick={ e => {this.selectToken(token) }} />
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
          mr={3}
          p={2}
          >
            <TokenSelectorItem disabled={false} handleClick={ e => {this.toggleOpen(e)} } token={this.props.selectedToken} />
            <Flex flexDirection={'column'} borderRadius={4} backgroundColor={'white'} overflow={'hidden'} className={[styles.selectorCurtain,this.state.opened ? styles.opened : null]} position={'absolute'} top={'60px'}>
              { tokens }
            </Flex>
        </Flex>
    );
  }
}
export default TokenSelector;
