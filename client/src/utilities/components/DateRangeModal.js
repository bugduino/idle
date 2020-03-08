import React from "react";
import {
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
      startDate: this.props.startDate ? this.props.startDate : new Date(),
      endDate: this.props.endDate ? this.props.endDate : new Date(),
      key: 'selection'
    }
  }

  handleSelect(ranges){
    this.setState({
      ranges:ranges.selection
    });
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.startDate !== this.props.startDate || prevProps.endDate !== this.props.endDate){
      this.setState({
        ranges:{
          startDate: this.props.startDate ? this.props.startDate : new Date(),
          endDate: this.props.endDate ? this.props.endDate : new Date(),
          key: 'selection'
        }
      });
    }
  }

  closeModal(){
    const newState = this.props.handleSelect(this.state.ranges);
    const ranges = {
      startDate:newState.startTimestampObj ? newState.startTimestampObj._d : new Date(),
      endDate:newState.endTimestampObj ? newState.endTimestampObj._d : new Date(),
      key: 'selection'
    };
    this.setState({
      ranges
    });
    this.props.closeModal();
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
              minDate={this.props.minDate}
              maxDate={this.props.maxDate}
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
                onClick={ e => this.closeModal(e) }
              >
              APPLY
              </Button>
            </Flex>
          </ModalCard.Footer>
        </ModalCard>
      </Modal>
    );
  }

}

export default DateRangeModal;