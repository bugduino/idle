import { Heading } from "rimble-ui";
import React, { Component } from 'react';

class Title extends Component {
  render() {
    const props = {
      color:'dark-gray',
      fontWeight:4,
      lineHeight:'initial',
      fontSize:[4,5],
      textAlign:'center'
    };

    // Replace props
    if (this.props && Object.keys(this.props).length){
      Object.keys(this.props).forEach(p => {
        props[p] = this.props[p];
      });
    }

    return (
      <Heading.h1
        {...props}
      >
        {this.props.children}
      </Heading.h1>
    );
  }
}

export default Title;
