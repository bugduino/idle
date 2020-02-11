import React from "react";
import {
  Text,
  Card,
  Flex,
  Icon,
  Button,
  Heading,
  Progress,
  Tooltip,
  Link,
  Image
} from "rimble-ui";
import styles from './DefiScoreTable.module.scss';
import colors from '../colors';

class DefiScoreProtocol extends React.Component {

  render(){

    const customTheme = {
      colors: {
        primary: colors.green
      }
    };

    const info = this.props.info;
    const score = (parseFloat(info.defiScore.risk.score)/10).toFixed(2);
    const defiScore = info.defiScore;
    const risk = defiScore.risk;

    return (
      <Card width={[1,1/2]} mx={[0,2]} my={[2,0]}>
        <Flex width={1} flexDirection={'column'}>
          <Flex pb={3} width={1} flexDirection={'row'} justifyContent={'center'} alignItems={'center'} borderBottom={'1px solid #eee'}>
            <Image src={info.icon} height={'40px'} mr={[2,3]} />
            <Heading.h3>{info.name}</Heading.h3>
          </Flex>
          <Flex flexDirection={'column'} py={3} justifyContent={'center'} alignItems={'center'}>
            <Heading.h2>{risk.score} / 10</Heading.h2>
            <Text fontSize={0} color={'darkGray'}>Provided by <Link href={`https://app.defiscore.io/assets/${this.props.token}/${this.props.protocol}`} target={'_blank'} rel="nofollow noopener noreferrer" fontSize={0} fontWeight={2} color={'dark-gray'} hoverColor={'blue'}>DeFi Score</Link></Text>
          </Flex>
          <Flex>
            <Progress value={score} className={styles.progressBar} theme={customTheme} />
          </Flex>
          <Flex py={3} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} borderBottom={'1px solid #eee'}>
            <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
              <Heading.h5>Open Source</Heading.h5>
              <Tooltip message="Is the smart contract code open to the public for inspection and verification?" placement="right">
                <Icon
                  style={{cursor:'pointer'}}
                  ml={1}
                  name={'InfoOutline'}
                  size={'1.1em'}
                  color={'dark-gray'}
                />
              </Tooltip>
            </Flex>
            <Flex borderRadius={'50%'} border={`3px solid ${risk.isOpenSource ? colors.green : colors.red}`} justifyContent={'center'} alignItems={'center'} p={'1px'}>
              <Icon
                align={'center'}
                name={ risk.isOpenSource ? 'Done' : 'Close'}
                color={ risk.isOpenSource ? colors.green : colors.red }
                size={"1.6em"}
              />
            </Flex>
          </Flex>
          <Flex py={3} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} borderBottom={'1px solid #eee'}>
            <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
              <Heading.h5>Audited</Heading.h5>
              <Tooltip message="Has a reputable security firm audited the smart contract code and published the results?" placement="right">
                <Icon
                  style={{cursor:'pointer'}}
                  ml={1}
                  name={'InfoOutline'}
                  size={'1.1em'}
                  color={'dark-gray'}
                />
              </Tooltip>
            </Flex>
            <Flex borderRadius={'50%'} border={`3px solid ${risk.isAudited ? colors.green : colors.red}`} justifyContent={'center'} alignItems={'center'} p={'1px'}>
              <Icon
                align={'center'}
                name={ risk.isAudited ? 'Done' : 'Close'}
                color={ risk.isAudited ? colors.green : colors.red }
                size={"1.6em"}
              />
            </Flex>
          </Flex>
          <Flex py={3} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} borderBottom={'1px solid #eee'}>
            <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
              <Heading.h5>Formally Verified</Heading.h5>
              <Tooltip message="Has the smart contract code been mathematicaly verified to ensure correct behavior?" placement="right">
                <Icon
                  style={{cursor:'pointer'}}
                  ml={1}
                  name={'InfoOutline'}
                  size={'1.1em'}
                  color={'dark-gray'}
                />
              </Tooltip>
            </Flex>
            <Flex borderRadius={'50%'} border={`3px solid ${risk.isFormallyVerified ? colors.green : colors.red}`} justifyContent={'center'} alignItems={'center'} p={'1px'}>
              <Icon
                align={'center'}
                name={ risk.isFormallyVerified ? 'Done' : 'Close'}
                color={ risk.isFormallyVerified ? colors.green : colors.red }
                size={"1.6em"}
              />
            </Flex>
          </Flex>
          <Flex py={3} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} borderBottom={'1px solid #eee'}>
            <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
              <Heading.h5>Market Liquidity</Heading.h5>
              <Tooltip message="The size of the lending pool" placement="right">
                <Icon
                  style={{cursor:'pointer'}}
                  ml={1}
                  name={'InfoOutline'}
                  size={'1.1em'}
                  color={'dark-gray'}
                />
              </Tooltip>
            </Flex>
            <Text fontWeight={4}>${ parseInt(defiScore.tvl) }</Text>
          </Flex>
          <Flex py={3} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
            <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
              <Heading.h5>Total Supply</Heading.h5>
              <Tooltip message="The total amount of funds supplied (held as collateral) in this lending pool" placement="right">
                <Icon
                  style={{cursor:'pointer'}}
                  ml={1}
                  name={'InfoOutline'}
                  size={'1.1em'}
                  color={'dark-gray'}
                />
              </Tooltip>
            </Flex>
            <Text fontWeight={4}>${ parseInt(defiScore.supplyVolume) }</Text>
          </Flex>
          <Flex>
            <Button as={'a'} width={1} href={`https://app.defiscore.io/assets/${defiScore.token}/${defiScore.protocol}`} target={'_blank'} rel="nofollow noopener noreferrer">View on DeFi Score</Button>
          </Flex>
        </Flex>
      </Card>
    );
  }
}

export default DefiScoreProtocol;