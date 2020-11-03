import {
  Link as RouterLink,
} from "react-router-dom";
import ExtLink from '../ExtLink/ExtLink';
import React, { Component } from 'react';
import styles from './Footer.module.scss';
import { Flex, Text, Heading, Image, Link } from 'rimble-ui'

class Footer extends Component {
  state = {};
  render() {
    const currYear = new Date().getFullYear();
    return (
      <Flex
        pl={0}
        id={"footer"}
        alignItems={'center'}
        flexDirection={'column'}
        className={styles.footer}
        backgroundColor={'white'}
        justifyContent={'flex-start'}
      >
        <Flex
          width={1}
          px={[3,6]}
          justifyContent={'center'}
        >
          <Flex
            width={1}
            height={['auto','100%']}
            alignItems={'flex-start'}
            maxWidth={['35em','70em']}
            justifyContent={'flex-start'}
            flexDirection={['column','row']}
          >
            <Flex width={[1,1/3]} flexDirection={'column'} height={['auto','100%']}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                Resources
              </Heading.h3>
              <Flex width={1} flexDirection={'column'}>
                <ExtLink pb={[3,2]} href={'https://developers.idle.finance'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Developers</ExtLink>
                <Flex pb={[3,2]} width={1} justifyContent={['center','flex-start']}>
                  <RouterLink to="/terms-of-service" style={{textDecoration:'none'}}>
                    <Text href={'#'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} fontWeight={3} color={'blue'} hoverColor={'blue'}>Terms of Service</Text>
                  </RouterLink>
                </Flex>
                <ExtLink pb={[3,2]} href={'https://www.iubenda.com/privacy-policy/61211749'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Privacy Policy</ExtLink>
                <ExtLink pb={[3,2]} href={'https://www.iubenda.com/privacy-policy/61211749/cookie-policy'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Cookie Policy</ExtLink>
                <ExtLink pb={[3,2]} href={'https://www.notion.so/idlelabs/Idle-Finance-Brand-Assets-fd63e4161cb64c999531646c7549bc4b'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Brand Assets</ExtLink>
              </Flex>
            </Flex>
            {
              /*
              <Flex width={[1,1/3]} flexDirection={'column'} height={['auto','100%']}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                  Governance
                </Heading.h3>
                <Flex width={1} flexDirection={'column'}>
                  <Flex pb={[3,2]} width={1} justifyContent={['center','flex-start']}>
                    <RouterLink to="/governance" style={{textDecoration:'none'}}>
                      <Text href={'#'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} fontWeight={3} color={'blue'} hoverColor={'blue'}>Overview</Text>
                    </RouterLink>
                  </Flex>
                  <Flex pb={[3,2]} width={1} justifyContent={['center','flex-start']}>
                    <RouterLink to="/governance/proposals" style={{textDecoration:'none'}}>
                      <Text href={'#'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} fontWeight={3} color={'blue'} hoverColor={'blue'}>Proposals</Text>
                    </RouterLink>
                  </Flex>
                  <Flex pb={[3,2]} width={1} justifyContent={['center','flex-start']}>
                    <RouterLink to="/governance/leaderboard" style={{textDecoration:'none'}}>
                      <Text href={'#'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} fontWeight={3} color={'blue'} hoverColor={'blue'}>Leaderboard</Text>
                    </RouterLink>
                  </Flex>
                </Flex>
              </Flex>
              */
            }
            <Flex width={[1,1/3]} flexDirection={'column'} height={['auto','100%']}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                Start a Conversation
              </Heading.h3>
              <Link textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>info@idle.finance</Link>
            </Flex>
            <Flex width={[1,1/3]} flexDirection={'column'}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                Explore
              </Heading.h3>
              <Flex flexDirection={'row'} justifyContent={['space-evenly','flex-start']}>
                <ExtLink href="https://twitter.com/idlefinance">
                  <Image src="images/social/twitter.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                <ExtLink href="https://t.me/idlefinance">
                  <Image src="images/social/telegram.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                <ExtLink href="https://discord.gg/mpySAJp">
                  <Image src="images/social/discord.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                <ExtLink href="https://medium.com/@idlefinance">
                  <Image src="images/social/medium.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                <ExtLink href="https://github.com/bugduino/idle-contracts">
                  <Image src="images/social/github.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                <ExtLink href="https://www.linkedin.com/company/idlefinance">
                  <Image src="images/social/linkedin.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} boxShadow={1} borderRadius={'7px'} />
                </ExtLink>
                {
                /*
                }
                <Link href={`https://etherscan.io/address/${this.props.tokenConfig.idle.address}#code`} target="_blank" rel="nofollow noopener noreferrer">
                  <Image src="images/etherscan.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                */
                }
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex
          width={1}
          height={['auto','100%']}
          flexDirection={'column'}
          alignItems={['center','flex-end']}
          justifyContent={['center','flex-end']}
        >
          <Flex
            p={2}
            width={1}
            alignItems={'center'}
            justifyContent={'center'}
            backgroundColor={'dark-blue'}
            flexDirection={['column','row']}
          >
            <Text
              color={'white'}
              textAlign={['center','flex-end']}
            >
              &copy; {currYear} - Idle Labs Inc.
            </Text>
            <RouterLink
              to={'/terms-of-service'}
              style={{textDecoration:'none'}}
            >
              <Text
                pl={2}
                color={'#0df'}
                textAlign={['center','flex-end']}
              >
                Terms of Service
              </Text>
            </RouterLink>
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default Footer;
