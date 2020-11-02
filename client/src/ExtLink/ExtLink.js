import { Link } from "rimble-ui";
import React, { Component } from 'react';

class ExtLink extends Component {

  render() {
    return (
      <Link
        target={'_blank'}
        rel={'nofollow noopener noreferrer'}
        {...this.props}
      >
        {this.props.children}
      </Link>
    );
  }
}

export default ExtLink;
