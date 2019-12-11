import React, { Component } from "react";
import { Button, Image, Flex, Text } from 'rimble-ui';

class ImageButton extends Component {

  render() {

    const image = (<Image width={'auto'} src={this.props.imageSrc} {...this.props.imageProps} />);
    const caption = (<Text textAlign={'center'} fontSize={2} fontWeight={3} color={'dark-gray'}>{this.props.caption}</Text>);

    return (
        <Button py={[3,4]} my={[2,0]} mx={[0,2]} width={['150px','170px']} height={['150px','170px']} mainColor={'white'} contrastColor={'white'} color={'white'} borderRadius={3} onClick={ this.props.handleClick }>
          <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
            { this.props.captionPos && this.props.captionPos === 'top' ? caption : image }
            { this.props.captionPos && this.props.captionPos === 'top' ? image : caption }
            {
              this.props.subcaption && this.props.subcaption.split('\n').map((v,i) => {
                // Smaller caption for second line
                if (i){
                  v = (<small>{v}</small>);
                }
                return (
                  <Text key={`subcaption_${i}`} lineHeight={'1.3'} textAlign={'center'} color={'darkGray'} fontWeight={1} fontSize={1}>{v}</Text>
                );
              })
            }
          </Flex>
        </Button>
    );
  }
}
export default ImageButton;
