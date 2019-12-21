import React from "react";
import { Flex, Loader, Text } from "rimble-ui";
import DefiScoreProtocol from './DefiScoreProtocol';
import protocols from '../configs/protocols';
import axios from 'axios';

class DefiScoreTable extends React.Component {

  state = {
    dataLoaded:false
  };

  async componentDidMount(){
    await this.loadData();
  }

  async loadData() {
    Object.keys(protocols).map(async (protocol,i) => {
      const token = protocols[protocol].defiScore.token ? protocols[protocol].defiScore.token : this.props.tokenConfig.defiScore.token;
      const defiScoreData = await axios
                          .get(`https://api.defiscore.io/earn/opportunities/${protocol}-${token}`)
                          .catch(err => {
                            console.error('Error getting request');
                          });
      protocols[protocol].defiScore = defiScoreData.data;
    });

    this.setState({
      dataLoaded:true
    });
  }

  render(){
    return (
      <Flex width={1} flexDirection={['column','row']} justifyContent={['center','space-even']} alignItems={'center'}>
        {
          this.state.dataLoaded ?
            Object.keys(protocols).map((protocol,i) => {
              const token = protocols[protocol].defiScore.token ? protocols[protocol].defiScore.token : this.props.tokenConfig.defiScore.token;
              return (
                <DefiScoreProtocol tokenConfig={this.props.tokenConfig} protocol={protocol} token={token} info={protocols[protocol]} key={`protocol_${protocol}`} />        
              )
            })
          : (
            <Flex
              justifyContent={'center'}
              alignItems={'center'}
              textAlign={'center'}
              width={1}>
              <Loader size="40px" /> <Text ml={2}>Loading DeFi Score data</Text>
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default DefiScoreTable;