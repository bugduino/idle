import React from "react";
import TransactionToastMessages from "./TransactionToastMessages";
import { ToastMessage } from "rimble-ui";

class TransactionToastUtil extends React.Component {
  // Determines if collections are same size
  collectionHasNewObject = (prevCollection, currentCollection) => {
    return (
      typeof prevCollection === "undefined" ||
      Object.keys(prevCollection).length !==
        Object.keys(currentCollection).length
    );
  };

  // Returns object from currentCollection that doesn't exist in prevCollection
  getNewObjectFromCollection = (prevCollection, currentCollection) => {
    if (typeof prevCollection !== "undefined") {
      const objectKey = Object.keys(currentCollection).filter(key => {
        return !Object.keys(prevCollection).includes(key);
      });
      return currentCollection[objectKey];
    } else {
      return Object.keys(currentCollection).map(key => {
        return currentCollection[key];
      });
    }
  };

  // Compare two collections of objects, return single object from current collection that differs from prev collection
  getUpdatedObjectFromCollection = (prevCollection, currentCollection) => {
    const updatedTransaction = Object.keys(prevCollection)
      .map(key => {
        if (
          prevCollection[key].lastUpdated !== currentCollection[key].lastUpdated
        ) {
          return currentCollection[key];
        } else {
          return null;
        }
      })
      .filter(object => object !== null);
    return updatedTransaction[0];
  };

  // Returns an transaction from a collection based on a given identifier
  getTransactionFromCollection = (identifier, collection) => {
    const object = collection[`tx${identifier}`];
    return object;
  };

  // Returns either a new object or finds an updated object in a collection against a previous collection
  getUpdatedTransaction = (prevCollection, currentCollection) => {
    let tx = null;
    let currentTx = {};
    let prevTx = {};

    if (this.collectionHasNewObject(prevCollection, currentCollection)) {
      tx = this.getNewObjectFromCollection(prevCollection, currentCollection);
    } else {
      currentTx = this.getUpdatedObjectFromCollection(
        prevCollection,
        currentCollection
      );
      if (currentTx) {
        prevTx = this.getTransactionFromCollection(
          currentTx.created,
          prevCollection
        );
      } else {
        return false;
      }

      if (currentTx.status !== prevTx.status) {
        tx = currentTx;
      }
    }
    return tx;
  };

  // Check for updates to the transactions collection
  processTransactionUpdates = prevProps => {
    let tx = null;
    if (Object.keys(this.props.transactions).length) {
      tx = this.getUpdatedTransaction(
        prevProps.transactions,
        this.props.transactions
      );
    }

    if (tx) {
      this.showTransactionToast(tx);
    }
  };

  showTransactionToast = transaction => {
    // console.log("showTransactionToast: ", { ...transaction });
    // Get text info for toast
    let toastMeta = this.getTransactionToastMeta(transaction);
    toastMeta.colorTheme = 'light';
    toastMeta.closeElem = true;
    // console.log('toastMeta',toastMeta);

    // Show toast
    window.toastProvider.addMessage(".", toastMeta);
  };

  getTransactionToastMeta = transaction => {
    let transactionToastMeta = {};
    let status = transaction.status;

    switch (status) {
      case "initialized":
        transactionToastMeta = TransactionToastMessages.initialized;
        break;
      case "started":
        transactionToastMeta = TransactionToastMessages.started;
        break;
      case "pending":
        transactionToastMeta = TransactionToastMessages.pending;
        break;
      case "confirmed":
        transactionToastMeta = TransactionToastMessages.confirmed;
        break;
      case "success":
        transactionToastMeta = TransactionToastMessages.success;
        break;
      case "error":
        transactionToastMeta = TransactionToastMessages.error;
        break;
      default:
        // do nothing
        break;
    }

    let transactionAction = '';
    switch (transaction.method){
      case 'redeemIdleToken':
        transactionAction = 'Redeem';
      break;
      case 'redeemGovTokens':
        transactionAction = 'Redeem (Gov Tokens)';
      break;
      case 'mintIdleToken':
      case 'mintIdleTokensProxy':
        transactionAction = 'Lending';
      break;
      case 'migrateFromToIdle':
      case 'migrateFromCompoundToIdle':
      case 'migrateFromFulcrumToIdle':
      case 'migrateFromAaveToIdle':
      case 'migrateFromIearnToIdle':
      case 'bridgeIdleV1ToIdleV2':
        transactionAction = 'Migration';
      break;
      case 'executeMetaTransaction':
        transactionAction = 'Meta-Tx';
      break;
      case 'approve':
        transactionAction = 'Approve';
      break;
      case 'rebalance':
        transactionAction = 'Rebalance';
      break;
      default:
        transactionAction = transaction.method.charAt(0).toUpperCase() + transaction.method.substr(1);
      break;
    }

    transactionToastMeta = JSON.parse(JSON.stringify(transactionToastMeta));

    let newMessage = transactionToastMeta.message.replace('{action}',transactionAction);
    newMessage = newMessage.charAt(0).toUpperCase() + newMessage.slice(1);
    transactionToastMeta.message = newMessage;
    transactionToastMeta.closeElem = true;

    return transactionToastMeta;
  };

  componentDidUpdate(prevProps, prevState) {
    this.processTransactionUpdates(prevProps);
  }

  render() {
    return (
      <div>
        <ToastMessage.Provider ref={node => (window.toastProvider = node)} />
      </div>
    );
  }
}

export default TransactionToastUtil;
