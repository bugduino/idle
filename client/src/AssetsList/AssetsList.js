import Title from '../Title/Title';
import React, { Component } from 'react';
// import style from './AssetsList.module.scss';
import AssetRow from '../AssetRow/AssetRow';
import { Flex, Box, Heading } from "rimble-ui";
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

    const TableCellHeader = (props) => (
      <Flex width={props.width}>
        <Heading.h4 color={'cellTitle'} fontSize={2} fontWeight={4} py={3} {...props} style={{width:'100%'}}>
          {props.children}
        </Heading.h4>
      </Flex>
    );

    return (
      <Box width={1}>
        <Title my={[3,4]}>Available assets</Title>
        <Flex id="assets-list-container" width={1} flexDirection={'column'}>
          <Flex
            width={1}
            pl={[3,4]}
            flexDirection={'row'}
            id="assets-list-header"
          >
            {
              this.props.cols.map((colInfo,colIndex) => {
                return (colInfo.title && colInfo.title.length) ? (
                  <TableCellHeader key={`col-header-${colIndex}`} {...colInfo.props}>{colInfo.title}</TableCellHeader>
                ) : (
                  <Flex key={`col-header-${colIndex}`} {...colInfo.props}></Flex>
                )
              })
            }
          </Flex>
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
      </Box>
    );
  }
}

export default AssetsList;
