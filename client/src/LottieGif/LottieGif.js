import React, { Component } from 'react';
import {
  Flex
} from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';

class LottieGif extends Component {

  functionsUtil = null

  componentDidMount = async () => {
    this.functionsUtil = new FunctionsUtil();

    const props = {
      id:'lottie-player-script'
    };
    if (!document.getElementById(props.id)){
      this.functionsUtil.loadScript('https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js',props);
    }
  }

  render() {
    const html = `
        <lottie-player
            src="${this.props.src}" background="transparent" speed="1" style="width: ${this.props.width}; height: ${this.props.height};position:absolute" loop controls autoplay>
        </lottie-player>`;
    return (
      <Flex
        alignItems={'center'}
        justifyContent={'center'}
        dangerouslySetInnerHTML={{__html:html}} />
    );
  }
}

export default LottieGif;
