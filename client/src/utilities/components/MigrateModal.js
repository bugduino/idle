import React from "react";
import ModalCard from './ModalCard';
import header_styles from './Header.module.scss';
import AssetField from '../../AssetField/AssetField';
import { Text, Modal, Flex, Checkbox } from "rimble-ui";
import SmartNumber from '../../SmartNumber/SmartNumber';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';

class MigrateModal extends React.Component {

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
        eventAction: 'continue_without_migrate',
        eventLabel: 'MigrateModal'
      });
      this.props.closeModal();
    } else {
      this.props.closeModal();
    }
  }

  toggleDontShowAgain = (dontShowAgain) => {

    if (dontShowAgain){
      this.functionsUtil.setLocalStorage('dontShowMigrateModal','true');
    } else {
      this.functionsUtil.removeStoredItem('dontShowMigrateModal');
    }

    this.setState({
      dontShowAgain
    });
  }

  migrate = () => {
    const tokenMigrationRoute = this.functionsUtil.getGlobalConfig(['tools','tokenMigration','route']);
    this.props.goToSection('tools/'+tokenMigrationRoute);
    this.props.closeModal();
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
            title={'Migrate to Idle'}
            icon={`images/migrate.svg`}
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
                You can migrate your funds from Compound, Aave, Fulcrum, Yearn and Idle V2 with just one transaction.
              </Text>
            </Flex>
            <Flex
              width={1}
              flexDirection={'column'}
            >
              <Flex
                my={2}
                alignItems={'center'}
                flexDirection={'column'}
              >
                {
                  this.props.protocolsTokensBalances && Object.keys(this.props.protocolsTokensBalances).map( token => (
                    <Flex
                      mb={2}
                      alignItems={'center'}
                      flexDirection={'row'}
                      key={`token_${token}`}
                      justifyContent={'space-between'}
                    >
                      <AssetField
                        token={token}
                        fieldInfo={{
                          name:'icon',
                          props:{
                            mr:2,
                            height:'2.3em'
                          }
                        }}
                        tokenConfig={this.props.protocolsTokensBalances[token].tokenConfig}
                      />
                      <SmartNumber
                        mr={2}
                        {...fieldProps}
                        minPrecision={5}
                        number={this.props.protocolsTokensBalances[token].balance} 
                      />
                      <AssetField
                        token={token}
                        fieldInfo={{
                          name:'tokenName',
                          props:fieldProps
                        }}
                        tokenConfig={this.props.protocolsTokensBalances[token].tokenConfig}
                      />
                    </Flex>
                  ) )
                }
                <Text
                  mb={0}
                  fontSize={1}
                  color={'red'}
                  fontWeight={500}
                  textAlign={'center'}
                >
                  Please be aware that by migrating your tokens from other protocols, your open positions might be liquidated if collateralized with migrated tokens.
                </Text>
              </Flex>
              <Flex
                mb={3}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <ButtonLoader
                  buttonText={'MIGRATE'}
                  handleClick={this.migrate}
                  isLoading={this.state.sendingForm}
                  buttonProps={{
                    width:['100%','50%'],
                    className:header_styles.gradientButton
                  }}
                >
                </ButtonLoader>
                {
                /*
                <Link mt={2} onClick={this.closeModal} hoverColor={'blue'}>continue without migrate</Link>
                */
                }
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

export default MigrateModal;