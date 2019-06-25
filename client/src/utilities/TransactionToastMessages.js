const TransactionToastMessages = {
    started: {
      message: "Lending request submitted",
      secondaryMessage: "Confirm with your wallet provider",
      actionHref: "",
      actionText: "",
      variant: "default",
      icon: "InfoOutline"
    },
    pending: {
      message: "Processing lending request...",
      secondaryMessage: "This may take a few minutes",
      actionHref: "",
      actionText: "",
      variant: "processing"
    },
    confirmed: {
      message: "First block confirmed",
      secondaryMessage: "Your lending request is in progress",
      actionHref: "",
      actionText: "",
      variant: "processing"
    },
    success: {
      message: "Lending request completed",
      variant: "success"
    },
    error: {
      message: "Lending request failed",
      secondaryMessage: "Could not complete transaction.",
      actionHref: "",
      actionText: "",
      variant: "failure"
    }
  };

  export default TransactionToastMessages;
