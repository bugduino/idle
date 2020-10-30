import { Heading } from "rimble-ui";
import React, { Component } from 'react';

class Title extends Component {
  render() {
    const props = {
      fontWeight:4,
      fontSize:[4,6],
      color:'copyColor',
      textAlign:'center',
      lineHeight:'initial',
    };

    // Replace props
    if (this.props && Object.keys(this.props).length){
      Object.keys(this.props).forEach(p => {
        props[p] = this.props[p];
      });
    }

    const HeadingComponent = this.props.component ? this.props.component : Heading.h1;

    return (
      <HeadingComponent
        {...props}
      >
        {this.props.children}
      </HeadingComponent>
    );
  }
}

export default Title;
