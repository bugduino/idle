import React from "react";
import ModalCard from './ModalCard';
import header_styles from './Header.module.scss';
import AssetField from '../../AssetField/AssetField';
import { Text, Modal, Flex, Checkbox } from "rimble-ui";
import SmartNumber from '../../SmartNumber/SmartNumber';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import RoundButton from '../../RoundButton/RoundButton.js';

class UpgradeModal extends React.Component {

  state = {
    dontShowAgain:false
  };

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  constructor(props) {
    super(props);
    this.loadUtils();
  }

  componentDidUpdate = async () => {
    this.loadUtils();
  }

  closeModal = async () => {
    const gaEventsEnabled = this.functionsUtil.getGlobalConfig(['globalConfigs','analytics','google','events','enabled']);
    // Send Google Analytics event
    if (gaEventsEnabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UI',
        eventAction: 'close_upgrade_modal',
        eventLabel: 'UpgradeModal'
      });
      this.props.closeModal();
    } else {
      this.props.closeModal();
    }
  }

  toggleDontShowAgain = (dontShowAgain) => {

    if (dontShowAgain){
      this.functionsUtil.setLocalStorage('dontShowUpgradeModal','true');
    } else {
      this.functionsUtil.removeStoredItem('dontShowUpgradeModal');
    }

    this.setState({
      dontShowAgain
    });
  }

  migrate = async (token) => {
    const gaEventsEnabled = this.functionsUtil.getGlobalConfig(['globalConfigs','analytics','google','events','enabled']);
    // Send Google Analytics event
    if (gaEventsEnabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UpgradeModal',
        eventAction: 'migrate',
        eventLabel: `${this.props.selectedStrategy}_${token}`
      });
      this.props.goToSection(`${this.props.selectedStrategy}/${token}`);
      this.props.closeModal();
    } else {
      this.props.goToSection(`${this.props.selectedStrategy}/${token}`);
      this.props.closeModal();
    }
  }

  render() {

    const fieldProps = {
      fontWeight:3,
      fontSize:[2,3],
      color:'cellText',
      flexProps:{
        justifyContent:'flex-start'
      }
    };

    return (
      <Modal
        isOpen={this.props.isOpen}
      >
        <ModalCard
          maxWidth={['960px','750px']}
          closeFunc={this.props.closeModal}
        >
          <ModalCard.Header
            iconHeight={'40px'}
            icon={`images/alert.svg`}
            title={'Upgrade Available'}
          >
          </ModalCard.Header>
          <ModalCard.Body>
            <Flex
              mb={0}
              width={1}
              flexDirection={'column'}
            >
              <Text
                my={0}
                fontSize={3}
                color={'mid-gray'}
                textAlign={'center'}
              >
                Idle now supports yield farming and governance tokens distribution, migrate now your portfolio with just one click!
              </Text>
            </Flex>
            <Flex
              width={1}
              flexDirection={'column'}
            >
              <Flex
                mt={3}
                alignItems={'center'}
                flexDirection={'row'}
              >
                <Flex
                  width={0.28}
                  fontWeight={[4,5]}
                  color={'copyColor'}
                >
                  ASSET TO MIGRATE
                </Flex>
                <Flex
                  width={0.19}
                  fontWeight={[4,5]}
                  color={'copyColor'}
                  justifyContent={'center'}
                >
                  BALANCE
                </Flex>
                <Flex
                  width={0.19}
                  fontWeight={[4,5]}
                  color={'copyColor'}
                  justifyContent={'center'}
                >
                  OLD APY
                </Flex>
                <Flex
                  width={0.19}
                  fontWeight={[4,5]}
                  color={'copyColor'}
                  justifyContent={'center'}
                >
                  NEW APY
                </Flex>
                <Flex
                  width={0.15}
                >
                  
                </Flex>
              </Flex>
              <Flex
                mb={3}
                width={1}
                alignItems={'center'}
                flexDirection={'column'}
              >
                {
                  this.props.tokensToMigrate && Object.keys(this.props.tokensToMigrate).map( token => {
                    const tokenConfig = this.props.tokensToMigrate[token].tokenConfig;
                    const balance = this.props.tokensToMigrate[token].oldContractBalanceFormatted;
                    return (
                      <Flex
                        mt={2}
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                        key={`token_${token}`}
                        justifyContent={'space-between'}
                      >
                        <Flex
                          width={0.28}
                          alignItems={'center'}
                          flexDirection={'row'}
                        >
                          <AssetField
                            fieldInfo={{
                              name:'icon',
                              props:{
                                mr:2,
                                height:'2.3em'
                              }
                            }}
                            tokenConfig={tokenConfig}
                            token={tokenConfig.idle.token}
                          />
                          <AssetField
                            fieldInfo={{
                              name:'tokenName',
                              props:fieldProps
                            }}
                            tokenConfig={tokenConfig}
                            token={tokenConfig.idle.token}
                          />
                        </Flex>
                        <Flex
                          width={0.19}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <SmartNumber
                            {...fieldProps}
                            minPrecision={5}
                            number={balance}
                            flexProps={{
                              justifyContent:'center'
                            }}
                          />
                        </Flex>
                        <Flex
                          width={0.19}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <AssetField
                            {...this.props}
                            fieldInfo={{
                              name:'apyNoGov',
                              props:fieldProps
                            }}
                            token={token}
                            tokenConfig={tokenConfig}
                          />
                        </Flex>
                        <Flex
                          width={0.19}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <AssetField
                            {...this.props}
                            fieldInfo={{
                              name:'apy',
                              props:fieldProps
                            }}
                            token={token}
                            tokenConfig={tokenConfig}
                          />
                        </Flex>
                        <Flex
                          width={0.15}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <RoundButton
                            handleClick={ e => this.migrate(token) }
                            buttonProps={{
                              size:'small',
                              width:'100%',
                              className:header_styles.gradientButton
                            }}
                          >
                            MIGRATE
                          </RoundButton>
                        </Flex>
                      </Flex>
                    );
                  })
                }
              </Flex>
              <Flex
                mb={3}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <RoundButton
                  handleClick={this.closeModal}
                  buttonProps={{
                    width:['100%','40%']
                  }}
                >
                  MIGRATE LATER
                </RoundButton>
                <Checkbox
                  mt={2}
                  required={false}
                  color={'mid-gray'}
                  checked={this.state.dontShowAgain}
                  label={`Don't show this popup again`}
                  onChange={ e => this.toggleDontShowAgain(e.target.checked) }
                />
              </Flex>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default UpgradeModal;