import React, { Component } from 'react';
import { Flex, Text, Heading, Image, Link } from 'rimble-ui'
import styles from './Footer.module.scss';
import {
  Link as RouterLink,
} from "react-router-dom";

class Footer extends Component {
  state = {};
  render() {
    const currYear = new Date().getFullYear();
    return (
      <Flex id="footer" flexDirection={'column'} className={styles.footer} backgroundColor={'white'} alignItems={'center'} justifyContent={'flex-start'} pl={0} px={[3,6]}>
        <Flex flexDirection={['column','row']} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']} height={['auto','100%']}>
          <Flex width={[1,1/3]} flexDirection={'column'} height={['auto','100%']}>
            <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
              Start a Conversation
            </Heading.h3>
            <Link textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>info@idle.finance</Link>
          </Flex>
          <Flex width={[1,1/3]} flexDirection={'column'} height={['auto','100%']}>
            <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
              Resources
            </Heading.h3>
            <Flex width={1} flexDirection={'column'}>
              <Link pb={[3,2]} href={'http://developers.idle.finance'} target={'_blank'} rel="nofollow noopener noreferrer" textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Developers</Link>
              <Flex pb={[3,2]} width={1} justifyContent={['center','flex-start']}>
                <RouterLink to="/terms-of-service" style={{textDecoration:'none'}}>
                  <Text href={'#'} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} fontWeight={3} color={'blue'} hoverColor={'blue'}>Terms of Service</Text>
                </RouterLink>
              </Flex>
              <Link pb={[3,2]} href={'https://www.iubenda.com/privacy-policy/61211749'} target={'_blank'} rel="nofollow noopener noreferrer" textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Privacy Policy</Link>
              <Link pb={[3,2]} href={'https://www.iubenda.com/privacy-policy/61211749/cookie-policy'} target={'_blank'} rel="nofollow noopener noreferrer" textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Cookie Policy</Link>
              <Link pb={[3,2]} href={'https://www.notion.so/idlelabs/Idle-Finance-Brand-Assets-fd63e4161cb64c999531646c7549bc4b'} target={'_blank'} rel="nofollow noopener noreferrer" textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} color={'blue'} hoverColor={'blue'}>Brand Assets</Link>
            </Flex>
          </Flex>
          <Flex width={[1,1/3]} flexDirection={'column'}>
            <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
              Explore
            </Heading.h3>
            <Flex flexDirection={'row'} justifyContent={['space-evenly','flex-start']}>
              <Link href="https://twitter.com/idlefinance" target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/twitter-logo.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://t.me/idlefinance" target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/telegram-logo.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://discord.gg/mpySAJp" target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/discord-logo.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://medium.com/@idlefinance" target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/medium-logo.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://github.com/bugduino/idle-contracts" target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/github-logo.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href={`https://etherscan.io/address/${this.props.tokenConfig.idle.address}#code`} target="_blank" rel="nofollow noopener noreferrer">
                <Image src="images/etherscan.png" height={'2.4em'} mr={['auto',3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
            </Flex>
          </Flex>
        </Flex>
        <Flex flexDirection={['column','row']} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']} height={['auto','100%']}>
          <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
          </Flex>
          <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
          </Flex>
          <Flex width={[1,4/10]} flexDirection={'column'} height={['auto','100%']} justifyContent={'flex-end'}>
            <Flex flexDirection={['column']} mt={[2, 0]}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,2]} my={3} color={'white'}>
                Built on
              </Heading.h3>
              <Flex flexDirection={['column','row']} alignItems={['normal','center']} justifyContent={['center','flex-start']}>
                <Link style={{flex:'1 1 0px'}} textAlign={['center','left']} pr={[0,3]} href="https://www.ethereum.org/" target="_blank" rel="nofollow noopener noreferrer">
                  <Image src="images/ethereum.png" width={[1/2,1]} height={'auto'} maxWidth={'initial'} mr={['auto',3]} ml={['auto',0]} my={[3,0]} />
                </Link>
                <Link style={{flex:'1 1 0px'}} textAlign={['center','left']} pr={[0,3]} href="https://app.compound.finance" target="_blank" rel="nofollow noopener noreferrer">
                  <Image src="images/compound-light.png" width={[1/2,1]} height={'auto'} maxWidth={'initial'} mr={['auto',3]} ml={['auto',0]} my={[3,0]} />
                </Link>
                <Link style={{flex:'1 1 0px'}} textAlign={['center','left']} href="https://fulcrum.trade" target="_blank" rel="nofollow noopener noreferrer">
                  <Image src="images/fulcrum.png" width={[1/2,1]} height={'auto'} maxWidth={'initial'} mr={['auto',3]} ml={['auto',0]} my={[3,0]} />
                </Link>
              </Flex>
              <Flex width={1} flexDirection={['column','row']} justifyContent={['center','flex-end']} align={['center','flex-end']} py={3}>
                <Text textAlign={['center','flex-end']} fontSize={[2,1]} py={[2,0]} color={'white'}>&copy; {currYear} - Idle Labs Inc.</Text>
                <RouterLink to="/terms-of-service" style={{textDecoration:'none'}}>
                  <Text textAlign={['center','flex-end']} pl={2} fontSize={[2,1]} py={[2,0]} color={'#0df'}>Terms of Service</Text>
                </RouterLink>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default Footer;
