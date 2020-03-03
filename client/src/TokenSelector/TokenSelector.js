import React, { Component } from "react";
import { Flex } from 'rimble-ui';
import styles from './TokenSelector.module.scss';
import FunctionsUtil from '../utilities/FunctionsUtil';
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

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  componentWillMount() {
    this.loadUtils();
  }

  componentDidMount() {
    this.loadUtils();
  }

  componentDidUpdate() {
    this.loadUtils();
  }

  selectToken(token,tokenInfo){
    if (tokenInfo.enabled){
      
      // Send Google Analytics event
      this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UI',
        eventAction: 'select_token',
        eventLabel: token
      });

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
                        if (!this.props.isMobile || tokenEnabled){
                          return (
                            <TokenSelectorItem isMobile={this.props.isMobile} disabled={!tokenEnabled} key={'token_selector_'+token} borderRadius={4} isChild={true} token={token} color={this.props.color} size={this.props.size} handleClick={ e => {this.selectToken(token,tokenInfo) }} />
                          );
                        }
                      }
                      return null;
                    });

    return (
        <Flex
          position={'relative'}
          flexDirection={'column'}
          width={['100%','auto']}
          alignItems={'center'}
          justifyContent={'flex-end'}
          onClick={ this.props.isMobile ? e => { this.toggleOpen() } : null }
          onMouseEnter={ this.props.isMobile ? null : e => {this.handleSelector(true)} }
          onMouseLeave={ this.props.isMobile ? null : e => {this.handleSelector(false)} }
          borderRadius={this.props.borderRadius}
          borderLeft={this.props.borderLeft}
          borderRight={this.props.borderRight}
          >
            <TokenSelectorItem isMobile={this.props.isMobile} borderRadius={this.props.borderRadius} disabled={false} token={this.props.selectedToken} color={this.props.color} size={this.props.size} />
            <Flex flexDirection={'column'} borderRadius={'1.5rem'} backgroundColor={ this.props.isMobile ? 'transparent' : 'white' } overflow={'hidden'} className={[styles.selectorCurtain,this.state.opened ? styles.opened : null]} position={['static','absolute']} top={'100%'}>
              { tokens }
            </Flex>
        </Flex>
    );
  }
}
export default TokenSelector;
