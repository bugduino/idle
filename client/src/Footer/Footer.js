import React, { Component } from 'react';
import { Flex, Text, Heading, Image, Link } from 'rimble-ui'
import styles from './Footer.module.scss';
import {
  Link as RouterLink,
} from "react-router-dom";

class Footer extends Component {
  state = {};

  render() {
    return (
      <Flex id="footer" flexDirection={'column'} className={styles.footer} backgroundColor={'white'} alignItems={'center'} justifyContent={'flex-start'} pl={0}>
        <Flex flexDirection={['column','row']} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']} height={['auto','100%']}>

          <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
            <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
              Start a Conversation
            </Heading.h3>
            <Link textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={2} color={'dark-gray'} hoverColor={'blue'}>info@idle.finance</Link>
          </Flex>

          <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
            <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
              Explore
            </Heading.h3>
            <Flex flexDirection={'row'} justifyContent={['space-evenly','flex-start']}>
              <Link href="https://twitter.com/idlefinance" target="_blank">
                <Image src="images/twitter-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://t.me/idlefinance" target="_blank">
                <Image src="images/telegram-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://discord.gg/mpySAJp" target="_blank">
                <Image src="images/discord-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://medium.com/@idlefinance" target="_blank">
                <Image src="images/medium-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://github.com/bugduino/idle" target="_blank">
                <Image src="images/github-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
              <Link href="https://etherscan.io/address/0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9#code" target="_blank">
                <Image src="images/etherscan.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
              </Link>
            </Flex>
          </Flex>

          <Flex width={[1,4/10]} flexDirection={'column'} height={['auto','100%']} justifyContent={'flex-end'}>
            <Flex flexDirection={['column']} mt={[2, 0]}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={2} my={3} color={'white'}>
                Built on
              </Heading.h3>
              <Flex flexDirection={['column','row']} alignItems={'center'} justifyContent={['center','flex-start']}>
                <Link width={1/3} pr={[0,3]} href="https://www.ethereum.org/" target="_blank">
                  <Image src="images/ethereum.png" height={['1.8em', '2.5em']} maxWidth={'initial'} mr={[0,3]} my={[2,0]} />
                </Link>
                <Link width={1/3} pr={[0,3]} href="https://app.compound.finance" target="_blank">
                  <Image src="images/compound-light.png" height={['1.8em', '2.5em']} maxWidth={'initial'} mr={[0,3]} my={[2,0]} />
                </Link>
                <Link width={1/3} pr={[0,3]} href="https://fulcrum.trade" target="_blank">
                  <Image src="images/fulcrum.svg" height={['1.8em', '2.5em']} maxWidth={'initial'} mr={[0,3]} my={[2,0]} />
                </Link>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex width={1} flexDirection={'row'} justifyContent={'center'} align={'center'} py={2}>
          <Text fontSize={1} textAlign={'center'} color={'white'}>&copy; 2019 - Idle Labs Inc.</Text>
          <RouterLink to="/terms-of-service" style={{textDecoration:'none'}}>
            <Text pl={2} fontSize={1} textAlign={'center'} color={'#0df'}>Terms of Service</Text>
          </RouterLink>
        </Flex>
      </Flex>
    );
  }
}

export default Footer;
