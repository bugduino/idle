import React from "react";

import NoWeb3BrowserModal from "./components/NoWeb3BrowserModal";
import NoWalletModal from "./components/NoWalletModal";
import WrongNetworkModal from "./components/WrongNetworkModal";

import ConnectionModal from "./components/ConnectionModal";
import ConnectionPendingModal from "./components/ConnectionPendingModal";
import UserRejectedConnectionModal from "./components/UserRejectedConnectionModal";

import LowFundsModal from "./components/LowFundsModal";

class ConnectionModalUtil extends React.Component {
  render() {
    return (
      <div>
        <NoWeb3BrowserModal
          closeModal={this.props.modals.methods.closeNoWeb3BrowserModal}
          isOpen={this.props.modals.data.noWeb3BrowserModalIsOpen}
          transaction={this.props.transaction}
        />

        <NoWalletModal
          closeModal={this.props.modals.methods.closeNoWalletModal}
          isOpen={this.props.modals.data.noWalletModalIsOpen}
          transaction={this.props.transaction}
        />

        <WrongNetworkModal
          closeModal={this.props.modals.methods.closeWrongNetworkModal}
          isOpen={this.props.modals.data.wrongNetworkModalIsOpen}
          network={this.props.network}
        />

        <ConnectionModal
          isMobile={this.props.isMobile}
          setConnector={this.props.setConnector}
          currentNetwork={this.props.network.current}
          validateAccount={this.props.validateAccount}
          closeModal={this.props.modals.methods.closeConnectionModal}
          isOpen={ this.props.modals.data.connectionModalIsOpen && !this.props.accountValidated }
        />

        <ConnectionPendingModal
          closeModal={this.props.modals.methods.closeConnectionPendingModal}
          isOpen={this.props.modals.data.accountConnectionPending}
          currentNetwork={this.props.network.current}
        />
        <UserRejectedConnectionModal
          closeModal={
            this.props.modals.methods.closeUserRejectedConnectionModal
          }
          isOpen={this.props.modals.data.userRejectedConnect}
          initAccount={this.props.initAccount}
        />

        <LowFundsModal
          closeModal={this.props.modals.methods.closeLowFundsModal}
          isOpen={this.props.modals.data.lowFundsModalIsOpen}
          currentNetwork={this.props.network.current}
          account={this.props.account}
        />
      </div>
    );
  }
}

export default ConnectionModalUtil;
