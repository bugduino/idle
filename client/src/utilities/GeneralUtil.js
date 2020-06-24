// Checks for MetaMask
const GeneralUtil = {
  hasMetaMask: () => {
    let hasMetaMask = false;

    if (typeof window.ethereum !== "undefined") {
      hasMetaMask = typeof window.ethereum.isMetaMask !== "undefined";
    } else if (typeof window.web3 !== 'undefined') {
      hasMetaMask = typeof window.web3.currentProvider.isMetaMask !== 'undefined' && window.web3.currentProvider.isMetaMask;
    }

    return hasMetaMask;
  },
  isTrustWallet: () => {
    if (typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== 'undefined'){
      return typeof window.web3.currentProvider.isTrust !== 'undefined' && window.web3.currentProvider.isTrust;
    }
    return false;
  },
  isCoinbaseWallet: () => {
    if (typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== 'undefined'){
      return typeof window.web3.currentProvider.isCoinbaseWallet !== 'undefined' && window.web3.currentProvider.isCoinbaseWallet;
    }
    return false;
  },
  hasDapper: () => {
    let hasDapper = typeof window.DapperEthereum !== 'undefined';

    if (typeof window.ethereum !== "undefined") {
      hasDapper = typeof window.ethereum.isDapper !== "undefined" && window.ethereum.isDapper;
    }

    return hasDapper;
  },
  isOpera: () => {
    return /Opera|OPR\//.test(navigator.userAgent);
  },
  // Current device is Android
  isAndroid: () => {
    const isAndroid = /android/i.test(navigator.userAgent) ? true : false;

    return isAndroid;
  },
  // Current device is iOS
  isIos() {
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        ? true
        : false;

    return isIos;
  }
};

export default GeneralUtil;
