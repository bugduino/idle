import React from "react";
import {
  Modal,
  Button,
  Flex,
  Field,
  Select
} from "rimble-ui";
import moment from 'moment';
import ModalCard from './ModalCard';
import 'react-date-range/dist/styles.css';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/theme/default.css';

class DateRangeModal extends React.Component {

  state = {
    quickSelection:'',
    ranges:{
      startDate: this.props.startDate ? this.props.startDate : new Date(),
      endDate: this.props.endDate ? this.props.endDate : new Date(),
      key: 'selection'
    }
  }

  handleSelect(ranges){
    this.setState({
      quickSelection:'',
      ranges:ranges.selection
    });
  }

  handleQuickSelect(e){
    let startDate = null;
    let endDate = moment(new Date());
    const quickSelection = e.target.value;

    switch (quickSelection){
      case 'day':
        startDate = endDate.clone().subtract(1,'day');
      break;
      case 'week':
        startDate = endDate.clone().subtract(1,'week');
      break;
      case 'weeks':
        startDate = endDate.clone().subtract(2,'week');
      break;
      case 'month':
        startDate = endDate.clone().subtract(1,'month');
      break;
      default:
        startDate = null;
        endDate = null;
      break;
    }

    if (startDate && endDate){
      startDate = startDate._d;
      endDate = endDate._d;

      const ranges = {
        startDate,
        endDate,
        key:'selection'
      };

      this.setState({
        ranges,
        quickSelection
      }, () => {
        this.closeModal();
      });
    }
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
    const newState = this.props.handleSelect(this.state.ranges,this.state.quickSelection);
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
            <Flex width={1} flexDirection={'column'} alignItems={'center'}>
              <Field label="Quick Date Selection" style={{display:'flex',width:'100%',alignItems:'stretch',justifyContent:'center'}}>
                <Select
                  style={{
                    color:'#7d888d',
                    fontSize:'14px',
                    height:'2.5em',
                    boxShadow:'none'
                  }}
                  width={'100%'}
                  required={true}
                  onChange={this.handleQuickSelect.bind(this)}
                  value={this.state.quickSelection}
                  options={[
                    { value: '', label: "Select an option" },
                    { value: "day", label: "Last day" },
                    { value: "week", label: "Last week" },
                    { value: "weeks", label: "Last 2 weeks" },
                    { value: "month", label: "Last month" }
                  ]}
                />
              </Field>
              <DateRange
                ranges={[this.state.ranges]}
                minDate={this.props.minDate}
                maxDate={this.props.maxDate}
                onChange={this.handleSelect.bind(this)}
              />
            </Flex>
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