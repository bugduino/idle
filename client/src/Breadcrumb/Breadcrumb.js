import theme from '../theme';
import React, { Component } from 'react';
import { Flex, Link, Text } from "rimble-ui";
import RoundIconButton from '../RoundIconButton/RoundIconButton';

class Breadcrumb extends Component {
  render() {

    const showPathMobile = !!this.props.showPathMobile;

    return (
      <Flex
        width={1}
        id={'breadcrumb'}
        alignItems={'center'}
      >
        {
          this.props.handleClick && 
           <RoundIconButton
             buttonProps={{
               width:'35px',
               height:'35px'
             }}
             iconSize={'1.2em'}
             iconName={'ArrowBack'}
             handleClick={this.props.handleClick}
           />
        }
        {
          this.props.text && this.props.text.length>0 &&
           <Link
             ml={[2,3]}
             fontSize={2}
             fontWeight={3}
             color={'cellText'}
             hoverColor={'copyColor'}
             onClick={this.props.handleClick}
           >
            {this.props.text}
           </Link>
        }
        {
          (!this.props.isMobile || showPathMobile) && this.props.path && this.props.path.length>0 &&
            this.props.path.map((path,index) => (
              <Text
                pl={[1,3]}
                ml={[1,3]}
                fontWeight={3}
                fontSize={[1,2]}
                color={'statValue'}
                style={ !this.props.isMobile ? {
                  maxWidth:'30%',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                } : null }
                key={`breadcrumb_path_${index}`}
                borderLeft={`1px solid ${theme.colors.divider}`}
              >
                {path}
              </Text>
            ))
        }
      </Flex>
    );
  }
}

export default Breadcrumb;