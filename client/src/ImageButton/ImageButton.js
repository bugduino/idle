import React, { Component } from "react";
import { Button, Image, Flex, Text, Icon, Box } from 'rimble-ui';

class ImageButton extends Component {

  render() {

    const isMobile = typeof this.props.isMobile !== 'undefined' ? this.props.isMobile : false;

    const image = this.props.imageSrc ? (<Image width={'auto'} src={this.props.imageSrc} {...this.props.imageProps} />) : ( this.props.iconName ? (<Icon name={this.props.iconName} {...this.props.iconProps} />) : null );
    const caption = (<Text textAlign={ isMobile ? 'left' : 'center'} fontSize={2} fontWeight={3} color={'dark-gray'}>{this.props.caption}</Text>);

    return (
        <Button
          color={'white'}
          borderRadius={3}
          mainColor={'white'}
          contrastColor={'white'}
          px={ isMobile ? [3,4] : 4 }
          py={ isMobile ? 0 : [3,4] }
          my={ isMobile ? 2 : [2,2] }
          mx={ isMobile ? 0 : [0,2] }
          onClick={ this.props.handleClick }
          height={ isMobile ? '58px' : ['150px','170px']}
          width={ this.props.width ? this.props.width : (isMobile ? '100%' : ['150px','170px']) }
          style={ this.props.buttonStyle ? this.props.buttonStyle : (isMobile ? {justifyContent:'flex-start'} : null) }
          {...this.props.buttonProps}
        >
          <>
            {
              this.props.badge && (
                <Box
                  position={'absolute'}
                  borderRadius={'16px'}
                  backgroundColor={ this.props.badge.bgColor ? this.props.badge.bgColor : 'blue' }
                  style={ isMobile ? {right:'-25px',top:'-17px'} : {right:'-25px',top:'-25px'} }
                  px={['5px','7px']}
                  py={['1px','3px']}
                >
                  <Text
                    fontWeight={3}
                    fontSize={'10px'}
                    color={ this.props.badge.color ? this.props.badge.color : '#fff' }
                  >
                  {this.props.badge.text}
                  </Text>
                </Box>
              )
            }
            <Flex flexDirection={ isMobile ? 'row' : 'column'} justifyContent={ isMobile ? 'flex-start' : 'center'} alignItems={'center'}>
              <Flex width={ isMobile ? '45px' : 1 } mr={ isMobile ? 2 : 0 } justifyContent={ isMobile ? 'flex-start' : 'center' }>
                { this.props.captionPos && this.props.captionPos === 'top' ? caption : image }
              </Flex>
              <Flex width={ isMobile ? 'auto' : 1 } flexDirection={'column'} justifyContent={ isMobile ? 'flex-start' : 'center' } >
                { this.props.captionPos && this.props.captionPos === 'top' ? image : caption }
                {
                  this.props.subcaption && this.props.subcaption.split('\n').map((v,i) => {
                    // Smaller caption for second line
                    if (i){
                      v = (<small>{v}</small>);
                    }
                    return (
                      <Text key={`subcaption_${i}`} lineHeight={'1.3'} textAlign={ isMobile ? 'left' : 'center'} color={'darkGray'} fontWeight={1} fontSize={1}>{v}</Text>
                    );
                  })
                }
              </Flex>
            </Flex>
          </>
        </Button>
    );
  }
}
export default ImageButton;
