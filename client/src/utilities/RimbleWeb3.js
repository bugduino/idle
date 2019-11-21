import React from 'react';

import ConnectionModalUtil from "./ConnectionModalsUtil";
import NetworkUtil from "./NetworkUtil";
import BigNumber from 'bignumber.js';
import Web3 from "web3";

require('dotenv').config();
const INFURA_KEY = process.env["REACT_APP_INFURA_KEY"];
const BNify = s => new BigNumber(String(s));

window.BNify = BNify;

const RimbleTransactionContext = React.createContext({
  contracts: [],
  account: {},
  accountBalance: {},
  accountBalanceToken: {},
  accountBalanceLow: {},
  tokenConfig: {},
  web3: {},
  transactions: {},
  checkPreflight: () => {},
  initWeb3: () => {},
  initContract: () => {},
  initAccount: () => {},
  getAccountBalance: () => {},
  rejectAccountConnect: () => {},
  accountValidated: {},
  accountValidationPending: {},
  rejectValidation: () => {},
  validateAccount: () => {},
  connectAndValidateAccount: () => {},
  network: {
    required: {},
    current: {},
    isCorrectNetwork: null,
    checkNetwork: () => {}
  },
  modals: {
    data: {
      noWeb3BrowserModalIsOpen: {},
      noWalletModalIsOpen: {},
      connectionModalIsOpen: {},
      accountConnectionPending: {},
      userRejectedConnect: {},
      accountValidationPending: {},
      userRejectedValidation: {},
      wrongNetworkModalIsOpen: {},
      transactionConnectionModalIsOpen: {},
      lowFundsModalIsOpen: {}
    },
    methods: {
      openNoWeb3BrowserModal: () => {},
      closeNoWeb3BrowserModal: () => {},
      closeConnectionPendingModal: () => {},
      openConnectionPendingModal: () => {},
      closeUserRejectedConnectionModal: () => {},
      openUserRejectedConnectionModal: () => {},
      closeUserRejectedValidationModal: () => {},
      openUserRejectedValidationModal: () => {},
      closeWrongNetworkModal: () => {},
      openWrongNetworkModal: () => {},
      closeLowFundsModal: () => {},
      openLowFundsModal: () => {}
    }
  },
  transaction: {
    data: {
      transactions: {}
    },
    meta: {},
    methods: {}
  }
});

class RimbleTransaction extends React.Component {
  static Consumer = RimbleTransactionContext.Consumer;

  // Initialize a web3 provider
  initWeb3 = async () => {

    console.log(this.props);

    const context = this.props.context;
    // if (!context.active) {
    //   if (localStorage && localStorage.getItem('walletProvider') === 'Injected') {
    //     console.log('Already logged in with Injected web3');
    //     await context.setFirstValidConnector(['Injected', 'Infura']);
    //   } else {
    //     console.log('Already logged in with Injected web3');
    //     await context.setFirstValidConnector(['Infura']);
    //   }
    //   return;
    // }
    let web3 = context.library;
    if (!web3) { // safety web3 implementation
      if (window.ethereum) {
        console.log("Using modern web3 provider.");
        web3 = new Web3(window.ethereum);
      } else if (window.web3) {
        console.log("Legacy web3 provider. Try updating.");
        web3 = new Web3(window.web3.currentProvider);
      } else {
        console.log("Non-Ethereum browser detected. Using Infura fallback.");
        const web3Provider = new Web3.providers.HttpProvider(
          `https://mainnet.infura.io/v3/${INFURA_KEY}`
        );
        web3 = new Web3(web3Provider);
      }
    }


    this.setState({ web3 }, async () => {
      // After setting the web3 provider, check network
      this.checkNetwork();
      await this.initializeContracts();
      if (context.account) {
        await this.initAccount(context.account);
      }
    });

    console.log("Finished initWeb3");
    return web3;
  };

  initContract = async (name, address, abi) => {
    console.log(`Init contract: ${name}`);

    return await this.createContract(name, address, abi);
  };

  createContract = async (name, address, abi) => {
    console.log(`creating contract ${name} - addr: ${address}`);
    // Create contract on initialized web3 provider with given abi and address
    try {
      const contract = new this.state.web3.eth.Contract(abi, address);
      this.setState(state => ({
        ...state,
        contracts: [...state.contracts, {name, contract}]
      }));
      return {name, contract};
    } catch (error) {
      console.log("Could not create contract.");
      console.log(error);
      window.toastProvider.addMessage("Contract creation failed.", {
        variant: "failure",
        colorTheme: 'light'
      });
    }
  };

  initAccount = async (hideModal = false) => {
    if (!hideModal) {
      this.openConnectionPendingModal();
    }

    try {
      // Request account access if needed
      await this.state.web3.eth.getAccounts().then(wallets => {
        const account = wallets[0];
        if (!hideModal) {
          this.closeConnectionPendingModal();
        }
        this.setState({ account/*:'[custom_addr]'*/ });

        console.log("wallet address:", this.state.account);

        // After account is complete, get the balance
        this.getAccountBalance();

        // TODO subscribe for account changes, no polling
        // set a state flag which indicates if the subscribe handler has been
        // called at least once
      });
    } catch (error) {
      // User denied account access...
      console.log("User cancelled connect request. Error:", error);

      // Reject Connect
      this.rejectAccountConnect(error);
    }
  };

  // TODO: Can this be moved/combined?
  rejectAccountConnect = error => {
    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = false;
    modals.data.userRejectedConnect = true;
    this.setState({ modals });
  };

  getAccountBalance = async () => {
    try {
      const res = await Promise.all([
        this.state.web3.eth.getBalance(this.state.account),
        this.getTokenBalance(this.state.account),
        this.getTokenDecimals()
      ]);

      console.log('getAccountBalance',res[0],res[1].toString(),res[2].toString());

      let accountBalance = res[0];
      if (accountBalance) {
        accountBalance = this.state.web3.utils.fromWei(
          accountBalance,
          "ether"
        );
        accountBalance = BNify(accountBalance).toString();
        this.setState({ accountBalance });
        console.log("account balance: ", accountBalance);
        this.determineAccountLowBalance();
      }

      const tokenDecimals = res[2].toString();
      let accountBalanceToken = res[1];

      // console.log('getAccountBalance',accountBalanceToken,accountBalanceToken.toString(),tokenDecimals,Math.pow(10,parseInt(tokenDecimals)));
      if (accountBalanceToken) {
        accountBalanceToken = BNify(accountBalanceToken.toString()).div(BNify(Math.pow(10,parseInt(tokenDecimals)).toString())).toString();
        this.setState({
          accountBalanceToken,
          [`accountBalance${this.props.selectedToken}`]:accountBalanceToken
        });
        console.log(`account balance ${this.props.selectedToken}: `, accountBalanceToken);
      }
    } catch (error) {
      console.log("Failed to get account balance.", error);
    }
  };

  initializeContracts = async() => {

    console.log('initializeContracts',this.props);

    const tokenConfig = this.props.tokenConfig;

    // Initialize Token Contract
    let foundTokenContract = this.state.contracts.find(c => c.name === this.props.selectedToken);
    if (!foundTokenContract) {
      await this.initContract(this.props.selectedToken, tokenConfig.address, tokenConfig.abi);
    }

    // Initialize IdleToken Contract
    let foundIdleTokenContract = this.state.contracts.find(c => c.name === tokenConfig.idle.token);
    if (!foundIdleTokenContract) {
      await this.initContract(tokenConfig.idle.token, tokenConfig.idle.address, tokenConfig.idle.abi);
    }
  }

  getContractByName = async (contractName) => {
    let contract = this.state.contracts.find(c => c.name === contractName);
    if (!contract) {
      const TOKEN = this.props.tokenConfig.abi;
      contract = await this.initContract(contractName, TOKEN.address, TOKEN.abi);
    }
    return contract.contract;
  }

  getTokenDecimals = async () => {
    const contract = await this.getContractByName(this.props.selectedToken);
    return await contract.methods.decimals().call().catch(error => {
      console.log(`Failed to get ${this.props.selectedToken} decimals`, error);
    });
  }

  getTokenBalance = async (account) => {
    const contract = await this.getContractByName(this.props.selectedToken);
    return await contract.methods.balanceOf(account).call().catch(error => {
      console.log(`Failed to get ${this.props.selectedToken} balance`, error);
    });
  };

  determineAccountLowBalance = () => {
    // If provided a minimum from config then use it, else default to 1
    const accountBalanceMinimum =
      typeof this.props.config !== "undefined" &&
      typeof this.props.config.accountBalanceMinimum !== "undefined"
        ? this.props.config.accountBalanceMinimum
        : 1;
    // Determine if the account balance is low
    const accountBalanceLow =
      this.state.accountBalance < accountBalanceMinimum;

    this.setState({
      accountBalanceLow
    });
  };

  connectAndValidateAccount = async () => {
    // Check for account
    if (!this.state.account) {
      // Show modal to connect account
      this.openConnectionModal();
    }
  };

  getRequiredNetwork = () => {
    const networkId =
      typeof this.props.config !== "undefined" &&
      typeof this.props.config.requiredNetwork !== "undefined"
        ? this.props.config.requiredNetwork
        : 1;
    let networkName = "";
    switch (networkId) {
      case 1:
        networkName = "Main";
        break;
      case 3:
        networkName = "Ropsten";
        break;
      case 4:
        networkName = "Rinkeby";
        break;
      case 42:
        networkName = "Kovan";
        break;
      default:
        networkName = "unknown";
    }

    let requiredNetwork = {
      name: networkName,
      id: networkId
    };

    let network = { ...this.state.network };
    network.required = requiredNetwork;

    this.setState({ network });
  };

  getNetworkId = async () => {
    try {
      return this.state.web3.eth.net.getId((error, networkId) => {
        let current = { ...this.state.network.current };
        current.id = networkId;
        let network = { ...this.state.network };
        network.current = current;
        this.setState({ network });
      });
    } catch (error) {
      console.log("Could not get network ID: ", error);
    }
  };

  getNetworkName = async () => {
    try {
      return this.state.web3.eth.net.getNetworkType((error, networkName) => {
        let current = { ...this.state.network.current };
        current.name = networkName;
        let network = { ...this.state.network };
        network.current = current;
        this.setState({ network });
      });
    } catch (error) {
      console.log("Could not get network Name: ", error);
    }
  };

  checkNetwork = async () => {
    this.getRequiredNetwork();
    await this.getNetworkId();
    await this.getNetworkName();

    let network = { ...this.state.network };
    network.isCorrectNetwork =
      this.state.network.current.id === this.state.network.required.id;

    this.setState({ network });
  };

  contractMethodSendWrapper = async (contractName, contractMethod, params = [], value = null, callback = null, callback_receipt = null) => {
    // Is it on the correct network?
    if (!this.state.network.isCorrectNetwork) {
      // wrong network modal
      this.state.modals.methods.openWrongNetworkModal();
      return;
    }

    // Is a wallet connected and verified?
    if (!this.state.account) {
    // if (!this.state.account || !this.state.accountValidated) {
      this.openConnectionModal();
      return;
    }

    // Are there a minimum amount of funds?
    if (this.state.accountBalanceLow) {
      this.openLowFundsModal();
      return;
    }

    // Is the contract loaded?

    // Create new tx and add to collection
    // Maybe this needs to get moved out of the wrapper?
    let transaction = this.createTransaction();
    transaction.method = contractMethod;

    this.addTransaction(transaction);

    // Add meta data to transaction
    transaction.type = "contract";
    transaction.status = "started";
    transaction.params = params;

    // Show toast for starting transaction
    this.updateTransaction(transaction);

    const { account, contracts } = this.state;
    let contract = contracts.find(c => c.name === contractName);
    if (!contract) {
      return console.log(`No contract with name ${contractName}`);
    }
    contract = contract.contract;
    try {
      // estimate gas price
      let gas = await contract.methods[contractMethod](...params)
        .estimateGas(value ? { from: account, value } : { from: account })
        .catch(e => console.error(e));

      if (gas) {
        gas = BNify(gas);
        gas = this.state.web3.utils.toBN(gas.plus(gas.times(BNify('0.3'))).integerValue(BigNumber.ROUND_FLOOR)); // 30% more
      }
      contract.methods[contractMethod](...params)
        .send(value ? { from: account, value, gas  } : { from: account, gas })
        .on("transactionHash", hash => {
          // Submitted to block and received transaction hash
          // Set properties on the current transaction
          transaction.transactionHash = hash;
          transaction.status = "pending";
          transaction.recentEvent = "transactionHash";
          this.updateTransaction(transaction);

          if (callback_receipt){
            callback_receipt(transaction);
          }
        })
        .on("confirmation", (confirmationNumber, receipt) => {
          // Update confirmation count on each subsequent confirmation that's received
          transaction.confirmationCount += 1;

          // How many confirmations should be received before informing the user
          const confidenceThreshold = this.props.config.requiredConfirmations || 1;

          if (transaction.confirmationCount === 1) {
            console.log('Confirmed', receipt);
            // Initial confirmation receipt
            transaction.status = "confirmed";
          } else if (transaction.confirmationCount < confidenceThreshold) {
            // Not enough confirmations to match threshold
          }

          if (transaction.confirmationCount === confidenceThreshold) {
            // Confirmations match threshold
            // Check the status from result since we are confident in the result
            if (receipt.status) {
              transaction.status = "success";
            } else if (!receipt.status) {
              transaction.status = "error";
            }
          } else if (transaction.confirmationCount > confidenceThreshold) {
            // Confidence threshold met
          }

          // Update transaction with receipt details
          transaction.recentEvent = "confirmation";
          this.updateTransaction(transaction);

          if (callback && transaction.confirmationCount<2) {
            callback(transaction);
          }
        })
        .on("receipt", receipt => {
          console.log('onReceipt', receipt);
          // Received receipt, met total number of confirmations
          transaction.recentEvent = "receipt";
          this.updateTransaction(transaction);
        })
        .on("error", error => {
          // Errored out
          transaction.status = "error";
          transaction.recentEvent = "error";
          this.updateTransaction(transaction);
          // TODO: should this be a custom error? What is the error here?
          // TODO: determine how to handle error messages globally
          window.toastProvider.addMessage("Something went wrong", {
            secondaryMessage: "Please retry",
            colorTheme: 'light',
            actionHref: "",
            actionText: "",
            variant: "failure",
            icon: 'Block'
          });

          if (callback) {
            callback(transaction);
          }
        });
    } catch (error) {
      console.log(error);
      transaction.status = "error";
      this.updateTransaction(transaction);
      // TODO: should this be a custom error? What is the error here?
      // TODO: determine how to handle error messages globally
      window.toastProvider.addMessage("Something went really wrong, we are sorry", {
        colorTheme: 'light',
        secondaryMessage: "Try refreshing the page :(",
        actionHref: "",
        actionText: "",
        variant: "failure",
        icon: 'Block'
      });
    }
  };

  // Create tx
  createTransaction = () => {
    let transaction = {};
    transaction.created = Date.now();
    transaction.lastUpdated = Date.now();
    transaction.status = "initialized";
    transaction.confirmationCount = 0;

    return transaction;
  };

  addTransaction = transaction => {
    const transactions = { ...this.state.transactions };
    transactions[`tx${transaction.created}`] = transaction;
    this.setState({ transactions });
  };

  // Add/update transaction in state
  updateTransaction = updatedTransaction => {
    const transactions = { ...this.state.transactions };
    const transaction = { ...updatedTransaction };
    transaction.lastUpdated = Date.now();
    transactions[`tx${updatedTransaction.created}`] = transaction;
    this.setState({ transactions });
  };

  // CONNECTION MODAL METHODS
  closeConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.connectionModalIsOpen = false;
    console.log("this.state", this.state);
    this.setState({ modals });
  };

  openConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.connectionModalIsOpen = true;
    this.setState({ modals: modals });
  };

  closeConnectionPendingModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = false;
    this.setState({ modals });
  };

  openConnectionPendingModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = true;
    modals.data.transactionConnectionModalIsOpen = false;
    modals.data.connectionModalIsOpen = false;

    this.setState({ modals });
  };

  closeUserRejectedConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.userRejectedConnect = false;
    this.setState({ modals });
  };

  openUserRejectedConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.userRejectedConnect = true;
    this.setState({ modals });
  };

  closeNoWeb3BrowserModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWeb3BrowserModalIsOpen = false;
    this.setState({ modals });
  };

  openNoWeb3BrowserModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWeb3BrowserModalIsOpen = true;
    this.setState({ modals });
  };

  closeNoWalletModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWalletModalIsOpen = false;
    this.setState({ modals });
  };

  openNoWalletModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWalletModalIsOpen = true;
    this.setState({ modals });
  };

  closeWrongNetworkModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.wrongNetworkModalIsOpen = false;
    this.setState({ modals });
  };

  openWrongNetworkModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.wrongNetworkModalIsOpen = true;
    this.setState({ modals });
  };

  closeLowFundsModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.lowFundsModalIsOpen = false;
    this.setState({ modals });
  };

  openLowFundsModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.lowFundsModalIsOpen = true;
    this.setState({ modals });
  };

  state = {
    contracts: [],
    account: null,
    accountBalance: null,
    accountBalanceDAI: null,
    accountBalanceLow: null,
    web3: null,
    transactions: {},
    checkPreflight: this.checkPreflight,
    initWeb3: this.initWeb3,
    initContract: this.initContract,
    initAccount: this.initAccount,
    getAccountBalance: this.getAccountBalance,
    contractMethodSendWrapper: this.contractMethodSendWrapper,
    rejectAccountConnect: this.rejectAccountConnect,
    accountValidated: null,
    accountValidationPending: null,
    rejectValidation: this.rejectValidation,
    validateAccount: this.validateAccount,
    connectAndValidateAccount: this.connectAndValidateAccount,
    network: {
      required: {},
      current: {},
      isCorrectNetwork: null,
      checkNetwork: this.checkNetwork
    },
    modals: {
      data: {
        noWeb3BrowserModalIsOpen: this.noWeb3BrowserModalIsOpen,
        noWalletModalIsOpen: this.noWalletModalIsOpen,
        connectionModalIsOpen: null,
        accountConnectionPending: null,
        userRejectedConnect: null,
        accountValidationPending: null,
        userRejectedValidation: null,
        wrongNetworkModalIsOpen: null,
        transactionConnectionModalIsOpen: null,
        lowFundsModalIsOpen: null
      },
      methods: {
        openNoWeb3BrowserModal: this.openNoWeb3BrowserModal,
        closeNoWeb3BrowserModal: this.closeNoWeb3BrowserModal,
        openNoWalletModal: this.openNoWalletModal,
        closeNoWalletModal: this.closeNoWalletModal,
        closeConnectionModal: this.closeConnectionModal,
        openConnectionModal: this.openConnectionModal,
        closeConnectionPendingModal: this.closeConnectionPendingModal,
        openConnectionPendingModal: this.openConnectionPendingModal,
        closeUserRejectedConnectionModal: this.closeUserRejectedConnectionModal,
        openUserRejectedConnectionModal: this.openUserRejectedConnectionModal,
        closeUserRejectedValidationModal: this.closeUserRejectedValidationModal,
        openUserRejectedValidationModal: this.openUserRejectedValidationModal,
        closeWrongNetworkModal: this.closeWrongNetworkModal,
        openWrongNetworkModal: this.openWrongNetworkModal,
        closeLowFundsModal: this.closeLowFundsModal,
        openLowFundsModal: this.openLowFundsModal
      }
    },
    transaction: {
      data: {
        transactions: null
      },
      meta: {},
      methods: {}
    }
  };

  render() {
    return (
      <div>
        <RimbleTransactionContext.Provider value={this.state} {...this.props} />
        <ConnectionModalUtil
          initAccount={this.state.initAccount}
          account={this.state.account}
          validateAccount={this.state.validateAccount}
          accountConnectionPending={this.state.accountConnectionPending}
          accountValidationPending={this.state.accountValidationPending}
          accountValidated={this.state.accountValidated}
          network={this.state.network}
          modals={this.state.modals}
        />
        <NetworkUtil network={this.state.network} web3={this.state.web3} />
      </div>
    );
  }
}

export default RimbleTransaction;
