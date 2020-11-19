import React, { Component } from 'react';
import { Flex, Text, Icon } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';

class CardIconButton extends Component {
  render() {
    const cardProps = Object.assign({
      py:1,
      width:'auto',
      px:['12px',3],
    },this.props.cardProps);

    return (
       <DashboardCard
         cardProps={cardProps}
         isInteractive={true}
         handleClick={this.props.handleClick}
       >
         <Flex
           my={1}
           alignItems={'center'}
           flexDirection={'row'}
           justifyContent={'center'}
         >
           <Flex
             mr={2}
             p={['4px','7px']}
             borderRadius={'50%'}
             alignItems={'center'}
             justifyContent={'center'}
             backgroundColor={ this.props.theme.colors.transactions.actionBg.redeem }
           >
             <Icon
               align={'center'}
               color={'redeem'}
               name={this.props.icon}
               size={ this.props.isMobile ? '1.2em' : '1.4em' }
             />
           </Flex>
           <Text
             fontWeight={3}
             fontSize={[1,3]}
           >
             {this.props.text}
           </Text>
         </Flex>
       </DashboardCard>
    );
  }
}

export default CardIconButton;