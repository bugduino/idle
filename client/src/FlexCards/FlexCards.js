import React, { Component } from 'react';
import { Flex, Link, Image } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class FlexCards extends Component {

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

    const itemPerc = this.props.itemsPerRow ? Math.floor(100/this.props.itemsPerRow)-2 : Math.floor(100/this.props.cards.length)-1;
    const justifyContent = this.props.justifyContent ? this.props.justifyContent : 'space-between';

    return (
      <Flex
        width={1}
        px={[3,0]}
        style={{
          flexWrap:'wrap'
        }}
        alignItems={'flex-start'}
        justifyContent={justifyContent}
        flexDirection={['column','row']}
      >
        {
          this.props.cards.map( (p,index) => (
            <DashboardCard
              isInteractive={true}
              key={`card_${index}`}
              cardProps={{
                p:2,
                mb:[2,3],
                display:'flex',
                alignItems:'center',
                height:['65px','80px'],
                justifyContent:'center',
                mx: justifyContent !== 'space-between' ? [0,2] : 0,
                style:{
                  textAlign:'center',
                  flex:this.props.isMobile ? null : `0 ${itemPerc}%`,
                }
              }}
            >
              {
                p.link ? (
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
                    target={'_blank'}
                    textAlign={'center'}
                    rel={'nofollow noopener noreferrer'}
                  >
                    <Image
                      src={p.image}
                      width={'auto'}
                      height={'auto'}
                      maxHeight={'50px'}
                    />
                  </Link>
                ) : (
                  <Image
                    src={p.image}
                    width={'auto'}
                    height={'auto'}
                    maxHeight={['35px','50px']}
                  />
                )
              }
            </DashboardCard>
            
          ) )
        }
      </Flex>
    );
  }
}

export default FlexCards;