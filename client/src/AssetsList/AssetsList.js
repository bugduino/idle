import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import TableRow from '../TableRow/TableRow';
import AssetField from '../AssetField/AssetField';
import TableHeader from '../TableHeader/TableHeader';
import FunctionsUtil from '../utilities/FunctionsUtil';

class AssetsList extends Component {

  state = {};

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentDidMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render() {

    return (
      <Flex id="assets-list-container" width={1} flexDirection={'column'}>
        <TableHeader
          cols={this.props.cols}
        />
        <Flex id="assets-list" flexDirection={'column'}>
          {
            Object.keys(this.props.availableTokens).map(token => {
              const tokenConfig = this.props.availableTokens[token];
              return (
                <TableRow
                  token={token}
                  {...this.props}
                  key={`asset-${token}`}
                  tokenConfig={tokenConfig}
                  fieldComponent={AssetField}
                />
              );
            })
          }
        </Flex>
      </Flex>
    );
  }
}

export default AssetsList;
