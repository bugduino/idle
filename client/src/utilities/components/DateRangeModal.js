import React from "react";
import {
  Text,
  Modal,
  Button,
  Flex,
} from "rimble-ui";
import ModalCard from './ModalCard';
import 'react-date-range/dist/styles.css';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/theme/default.css';

class DateRangeModal extends React.Component {

  state = {
    ranges:{
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    }
  }

  handleSelect(ranges){
    this.setState({
      ranges:ranges.selection
    });
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.props.closeModal}>
          <ModalCard.Header title={'Select Date Range'}>
          </ModalCard.Header>
          <ModalCard.Body>
            <DateRange
              ranges={[this.state.ranges]}
              onChange={this.handleSelect.bind(this)}
            />
          </ModalCard.Body>
          <ModalCard.Footer>
            <Flex px={[2,0]} flexDirection={['column', 'row']} width={1} justifyContent={'center'}>
              <Button
                borderRadius={4}
                my={2}
                mx={[0, 2]}
                size={this.props.isMobile ? 'small' : 'medium'}
                onClick={ e => this.props.closeModal(e) }
              >
              CLOSE
              </Button>
            </Flex>
          </ModalCard.Footer>
        </ModalCard>
      </Modal>
    );
  }

}

export default DateRangeModal;