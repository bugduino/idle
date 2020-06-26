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

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    return (
      <Flex id="assets-list-container" width={1} flexDirection={'column'}>
        <TableHeader
          {...this.props}
          cols={this.props.cols}
          isMobile={this.props.isMobile}
        />
        <Flex id="assets-list" flexDirection={'column'}>
          {
            enabledTokens.map(token => {
              const tokenConfig = this.props.availableTokens[token];
              if (!tokenConfig){
                return null;
              }
              return (
                <TableRow
                  token={token}
                  {...this.props}
                  key={`asset-${token}`}
                  tokenConfig={tokenConfig}
                  fieldComponent={AssetField}
                  rowId={`asset-col-${token}`}
                  cardId={`asset-card-${token}`}
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
