import React from "react";
import {
  Box,
  Flex,
  Card,
  Button,
  Heading,
  Image
} from "rimble-ui";

const ModalCard = ({children, closeFunc, ...props}) => (
  <Card
    border={0}
    mx={'auto'}
    my={'auto'}
    p={0}
    height={['100vh', 'auto']}
    width={['auto']}
    maxWidth={'960px'}
    overflow={'auto'}
    borderRadius={2}
  >
    <Box
      position={"absolute"}
      top={'0'}
      right={'0'}
      m={3}
      borderRadius={'100%'}
      bg={'white'}
    >
      <Button.Text
        icononly
        icon={"Close"}
        mainColor={"moon-gray"}
        onClick={closeFunc}
        size={'2.5em'}
      />
    </Box>
    <Flex flex={'1 1 auto'} style={{ overflow: 'auto',background: 'url(images/bg-bottom-right.png) no-repeat bottom right',backgroundSize:'65%' }} flexDirection={'column'} height={'100%'}>
      {children}
    </Flex>
  </Card>
);

ModalCard.Header = (props) => (
  <Box width={1} borderBottom={'1px solid #eee'} pt={props.icon ? 3 : [5,3]} mb={[2,3]} pb={[2,2]}>
    <Flex flexDirection={'column'} alignItems={'center'} px={[1,2]}>
      { props.icon && <Image width={'50px'} src={props.icon} /> }
      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mt={props.icon ? 2 : 0} mb={0} color={'copyColor'}>
        {props.title}
      </Heading.h3>
      {
        props.subtitle &&
        <Heading.h4 pt={[1,2]} fontSize={[2,2]} textAlign={'center'} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
          {props.subtitle}
        </Heading.h4>
      }
      {
        props.subtitle2 &&
        <Heading.h4 pt={0} fontSize={[2,2]} textAlign={'center'} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
          {props.subtitle2}
        </Heading.h4>
      }
    </Flex>
  </Box>
);

ModalCard.Body = ({children, ...props}) => (
  <Box width={1} px={[3,5]}>
    {children}
  </Box>
);
/*
ModalCard.Body = ({children, ...props}) => (
  <Flex flex={'1 1 auto'} style={{ overflow: 'auto' }} >
    <Box width={1} px={[4,5]} py={[3,4]} m={'auto'}>
      {children}
    </Box>
  </Flex>
);
*/

ModalCard.Footer = ({children, ...props}) => (
  <Flex
    flex={'1 0 auto'}
    justifyContent={'center'}
    borderTop={1}
    borderColor={'light-gray'}
    px={[0,3]}
    py={3}
  >
    {children}
  </Flex>
);


ModalCard.BackButton = ({onClick, ...props}) => (
  <Box
    position={'absolute'}
    top={'0'}
    left={'0'}
    m={3}
    bg={'white'}
  >
    <Button.Outline
      onClick={onClick}
      icononly
      icon={'ArrowBack'}
      size={'2.5em'}
    />
  </Box>
);

export default ModalCard;
