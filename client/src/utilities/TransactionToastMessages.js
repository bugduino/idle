const TransactionToastMessages = {
    initialized: {
      message: "{action} request initialized",
      secondaryMessage: "Confirm with your wallet provider",
      actionHref: "",
      actionText: "",
      variant: "default",
      icon: "InfoOutline"
    },
    started: {
      message: "{action} request submitted",
      secondaryMessage: "Confirm with your wallet provider",
      actionHref: "",
      actionText: "",
      variant: "default",
      icon: "InfoOutline"
    },
    pending: {
      message: "Processing {action} request...",
      secondaryMessage: "This may take a few minutes",
      actionHref: "",
      actionText: "",
      variant: "processing",
      icon: "InfoOutline"
    },
    confirmed: {
      message: "First block confirmed",
      secondaryMessage: "Your {action} request is in progress",
      actionHref: "",
      actionText: "",
      variant: "processing",
      icon: 'CheckCircle'
    },
    success: {
      message: "{action} request completed",
      variant: "success",
      icon: 'CheckCircle'
    },
    error: {
      message: "{action} request failed",
      secondaryMessage: "Could not complete transaction.",
      actionHref: "",
      actionText: "",
      variant: "failure",
      icon: "Block"
    }
  };

  export default TransactionToastMessages;
