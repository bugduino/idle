import React, { Component } from 'react';
// import style from './AssetsList.module.scss';
import AssetRow from '../AssetRow/AssetRow';
import { Flex } from "rimble-ui";
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
                <AssetRow
                  token={token}
                  {...this.props}
                  key={`asset-${token}`}
                  tokenConfig={tokenConfig}
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
