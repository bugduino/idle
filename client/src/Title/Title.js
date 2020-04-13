import { Heading } from "rimble-ui";
import React, { Component } from 'react';

class Title extends Component {
  render() {
    const props = {
      fontWeight:4,
      fontSize:[4,6],
      color:'dark-gray',
      textAlign:'center',
      lineHeight:'initial',
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
