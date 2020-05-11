import theme from '../theme';
import React, { Component } from 'react';
import { Flex, Link, Text } from "rimble-ui";
import RoundIconButton from '../RoundIconButton/RoundIconButton';

class Breadcrumb extends Component {
  render() {
    return (
      <Flex
        width={1}
        id={'breadcrumb'}
        alignItems={'center'}
      >
       <RoundIconButton
         buttonProps={{
           width:'35px',
           height:'35px'
         }}
         iconSize={'1.2em'}
         iconName={'ArrowBack'}
         handleClick={this.props.handleClick}
       />
       <Link
         ml={3}
         fontSize={2}
         fontWeight={3}
         color={'cellText'}
         hoverColor={'copyColor'}
         onClick={this.props.handleClick}
       >
        {this.props.text}
       </Link>
       {
        this.props.path && this.props.path.length>0 &&
          this.props.path.map((path) => (
           <Text
             ml={3}
             pl={3}
             fontSize={2}
             fontWeight={3}
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