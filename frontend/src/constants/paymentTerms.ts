export interface PaymentTermsConfig {
  title: string;
  subtitle: string;
  points: string[];
  checkboxLabel: string;
  acceptButtonText: string;
  cancelButtonText: string;
}

export const PAYMENT_TERMS_AND_CONDITIONS: PaymentTermsConfig = {
  title: "Payment Terms & Conditions",
  subtitle: "Please read and accept the following terms before proceeding to the payment gateway.",
  points: [
    "Once a payment is made, it is non-refundable and non-cancellable.",
    "Transaction fees, if applicable, will be borne by the cardholder, including duplicate payments.",
    "Transaction fee charges are non-refundable and will not be reversed in case of refunds, reversals, chargebacks, or duplicate payments.",
    "For any payment-related queries, disputes, refunds, or chargebacks, users should contact our Helpdesk/Support."
  ],
  checkboxLabel: "I have read and agree to the Terms & Conditions.",
  acceptButtonText: "Pay Now",
  cancelButtonText: "Cancel"
};
