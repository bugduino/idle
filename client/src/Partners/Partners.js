import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import { Flex, Heading, Link, Image } from "rimble-ui";

class Partners extends Component {

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {

    const partners = [
      {
        link:'https://app.compound.finance',
        image:'images/partners/compound.svg'
      },
      {
        link:'https://fulcrum.trade',
        image:'images/partners/fulcrum.svg'
      },
      {
        link:'https://aave.com',
        image:'images/partners/aave.svg'
      },
      {
        link:'https://dydx.exchange',
        image:'images/partners/dydx.svg'
      },
      {
        link:'https://oasis.app/',
        image:'images/partners/oasis.png'
      },
    ];

    return (
      <Flex
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Heading.h4
          fontSize={5}
          fontWeight={5}
          color={'dark-gray'}
          textAlign={'center'}
          lineHeight={'initial'}
        >
          Partners
        </Heading.h4>
        <Flex
          width={1}
          mt={[3,4]}
          px={[3,0]}
          style={{
            flexWrap:'wrap'
          }}
          alignItems={'center'}
          flexDirection={['column','row']}
          justifyContent={'space-between'}
        >
          {
            partners.map( p => (
              <DashboardCard
                isInteractive={true}
                cardProps={{
                  mt:[3,0],
                  height:'80px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  style:{
                    flex:this.props.isMobile ? null : `0 ${Math.floor(100/partners.length-1)}%`,
                    textAlign:'center',
                  }
                }}
              >
                <Link
                  px={[5,4]}
                  style={{
                    width:'100%',
                    height:'100%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                  }}
                  href={p.link}
                  target={"_blank"}
                  textAlign={'center'}
                  rel={"nofollow noopener noreferrer"}
                >
                  <Image
                    src={p.image}
                    width={'auto'}
                    height={'auto'}
                    maxHeight={'50px'}
                  />
                </Link>
              </DashboardCard>
              
            ) )
          }
        </Flex>
      </Flex>
    );
  }
}

export default Partners;
