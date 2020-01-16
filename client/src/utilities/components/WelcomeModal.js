import React from "react";
import {
  Text,
  Modal,
  Button,
  Form,
  Icon,
  Flex
} from "rimble-ui";
import ModalCard from './ModalCard';
import colors from '../../colors';

export default function WelcomeModal(props) {
  const { isOpen, closeModal } = props;
  // const walletProvider = localStorage ? ' '+localStorage.getItem('walletProvider')+' ' : null;
  // const icon = walletProvider ? walletProvider.trim().toLowerCase()+'.svg' : 'idle-dai.png';
  const icon = 'idle-mark.png';

  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Header title={`Add your Email`} icon={`images/${icon}`}>
        </ModalCard.Header>
        <ModalCard.Body>
          <Flex width={1} flexDirection={'column'} mb={3}>
            <Text color={'darkGray'} textAlign={'left'} fontSize={2} my={0}>
              Just one more step to get the best Idle experience:
            </Text>
            <Flex my={2} flexDirection={'row'} alignItems={'center'}>
              <Icon
                name={'CheckCircle'}
                color={colors.green}
                size={'32'}
              />
              <Text color={'dark-gray'} textAlign={'left'} fontSize={3} my={0} ml={2}>
                Feature 1
              </Text>
            </Flex>
            <Flex my={2} flexDirection={'row'}>
              <Icon
                name={'CheckCircle'}
                color={colors.green}
                size={'32'}
              />
              <Text color={'dark-gray'} textAlign={'left'} fontSize={3} my={0} ml={2}>
                Feature 2
              </Text>
            </Flex>
            <Flex my={2} flexDirection={'row'}>
              <Icon
                name={'CheckCircle'}
                color={colors.green}
                size={'32'}
              />
              <Text color={'dark-gray'} textAlign={'left'} fontSize={3} my={0} ml={2}>
                Feature 3
              </Text>
            </Flex>
            <Form.Field width={1} label={''}>
              <Form.Input
                type="email"
                name="EMAIL"
                width={1}
                outline={'none'}
                border={0}
                textAlign={['center','left']}
                placeholder={'Enter your e-mail'}
                onChange={ () => {} }
                required
              />
            </Form.Field>
          </Flex>
        </ModalCard.Body>

        <ModalCard.Footer>
          <Button
            onClick={closeModal}
            borderRadius={4}>
            START LENDING
          </Button>
        </ModalCard.Footer>
      </ModalCard>
    </Modal>
  );
}
