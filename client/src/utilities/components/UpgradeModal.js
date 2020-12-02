import React from "react";
import ModalCard from './ModalCard';
import header_styles from './Header.module.scss';
import AssetField from '../../AssetField/AssetField';
import SmartNumber from '../../SmartNumber/SmartNumber';
import { Text, Modal, Flex, Checkbox } from "rimble-ui";
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

  migrate = async (token,strategy=null) => {

    if (!strategy){
      strategy = this.props.selectedStrategy;
    }

    const gaEventsEnabled = this.functionsUtil.getGlobalConfig(['globalConfigs','analytics','google','events','enabled']);
    // Send Google Analytics event
    if (gaEventsEnabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UpgradeModal',
        eventAction: 'migrate',
        eventLabel: `${this.props.selectedStrategy}_${token}`
      });
      this.props.goToSection(`${strategy}/${token}`);
      this.props.closeModal();
    } else {
      this.props.goToSection(`${strategy}/${token}`);
      this.props.closeModal();
    }
  }

  convert = async (token) => {
    const convertTool = this.functionsUtil.getGlobalConfig(['tools','tokenMigration']);
    const gaEventsEnabled = this.functionsUtil.getGlobalConfig(['globalConfigs','analytics','google','events','enabled']);
    // Send Google Analytics event
    if (gaEventsEnabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UpgradeModal',
        eventAction: 'migrate',
        eventLabel: `${this.props.selectedStrategy}_${token}`
      });
      this.props.goToSection(`tools/${convertTool.route}/${token}`);
      this.props.closeModal();
    } else {
      this.props.goToSection(`tools/${convertTool.route}/${token}`);
      this.props.closeModal();
    }
  }

  render() {

    if (!this.props.availableStrategies || !this.props.availableTokens){
      return null;
    }

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
            icon={`images/migrate.svg`}
            title={'Upgrade Available'}
            iconHeight={['35px','40px']}
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
                fontSize={[2,3]}
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
                mt={[2,3]}
                alignItems={'center'}
                flexDirection={'row'}
              >
                <Flex
                  fontSize={[2,3]}
                  width={[0.5,0.28]}
                  fontWeight={[4,5]}
                  color={'copyColor'}
                >
                  {
                    this.props.isMobile ? 'ASSET' : 'ASSET TO MIGRATE'
                  }
                </Flex>
                {
                  !this.props.isMobile && (
                    <Flex
                      width={0.19}
                      fontWeight={[4,5]}
                      color={'copyColor'}
                      justifyContent={'center'}
                    >
                      BALANCE
                    </Flex>
                  )
                }
                {
                  !this.props.isMobile && (
                    <Flex
                      width={0.19}
                      fontWeight={[4,5]}
                      color={'copyColor'}
                      justifyContent={'center'}
                    >
                      OLD APY
                    </Flex>
                  )
                }
                <Flex
                  fontSize={[2,3]}
                  fontWeight={[4,5]}
                  width={[0.25,0.19]}
                  color={'copyColor'}
                  justifyContent={'center'}
                >
                  {
                    this.props.isMobile ? 'APY' : 'NEW APY'
                  }
                </Flex>
                <Flex
                  width={[0.25,0.15]}
                >
                  
                </Flex>
              </Flex>
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'column'}
              >
                {
                  this.props.tokensToMigrate && Object.keys(this.props.tokensToMigrate).map( tokenKey => {
                    const token = this.props.tokensToMigrate[tokenKey].token;
                    const strategy = this.props.tokensToMigrate[tokenKey].strategy;
                    const tokenConfig = this.props.tokensToMigrate[tokenKey].tokenConfig;
                    const balance = this.props.tokensToMigrate[tokenKey].oldContractBalanceFormatted;
                    return (
                      <Flex
                        mt={2}
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                        key={`token_${tokenKey}`}
                        justifyContent={'space-between'}
                      >
                        <Flex
                          width={[0.5,0.28]}
                          alignItems={'center'}
                          flexDirection={'row'}
                        >
                          <AssetField
                            fieldInfo={{
                              name:'icon',
                              props:{
                                mr:2,
                                height:['1.8em','2.3em']
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
                        {
                          !this.props.isMobile && (
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
                          )
                        }
                        {
                          !this.props.isMobile && (
                            <Flex
                              width={0.19}
                              alignItems={'center'}
                              justifyContent={'center'}
                            >
                              <AssetField
                                {...this.props}
                                fieldInfo={{
                                  name:'oldApy',
                                  props:fieldProps
                                }}
                                token={token}
                                tokenConfig={tokenConfig}
                              />
                            </Flex>
                          )
                        }
                        <Flex
                          width={[0.25,0.19]}
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
                          width={[0.25,0.15]}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <RoundButton
                            handleClick={ e => this.migrate(token,strategy) }
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
                width={1}
                alignItems={'center'}
                flexDirection={'column'}
              >
                {
                  this.props.oldIdleTokensToMigrate && Object.keys(this.props.oldIdleTokensToMigrate).map( token => {
                    const tokenConfig = this.props.oldIdleTokensToMigrate[token].tokenConfig;

                    if (!tokenConfig){
                      return null;
                    }

                    const balance = this.props.oldIdleTokensToMigrate[token].balance;
                    let newTokenConfig = null;

                    if (tokenConfig.availableStrategies && !this.props.availableTokens[tokenConfig.baseToken]){
                      newTokenConfig = this.props.availableStrategies[tokenConfig.availableStrategies[0]][tokenConfig.baseToken];
                    } else {
                      newTokenConfig = this.props.availableTokens[tokenConfig.baseToken];
                    }
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
                            token={token}
                          />
                          <AssetField
                            fieldInfo={{
                              name:'tokenName',
                              props:fieldProps
                            }}
                            tokenConfig={tokenConfig}
                            token={token}
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
                              name:'oldApy',
                              props:fieldProps
                            }}
                            token={newTokenConfig.token}
                            tokenConfig={newTokenConfig}
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
                            token={newTokenConfig.token}
                            tokenConfig={newTokenConfig}
                          />
                        </Flex>
                        <Flex
                          width={0.15}
                          alignItems={'center'}
                          justifyContent={'center'}
                        >
                          <RoundButton
                            handleClick={ e => this.convert(token) }
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
                my={3}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <RoundButton
                  handleClick={this.closeModal}
                  buttonProps={{
                    fontSize:[2,3],
                    width:['100%','40%'],
                  }}
                >
                  MIGRATE LATER
                </RoundButton>
                {
                  <Checkbox
                    mt={2}
                    required={false}
                    color={'mid-gray'}
                    checked={this.state.dontShowAgain}
                    label={`Don't show this popup again`}
                    onChange={ e => this.toggleDontShowAgain(e.target.checked) }
                  />
                }
              </Flex>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default UpgradeModal;