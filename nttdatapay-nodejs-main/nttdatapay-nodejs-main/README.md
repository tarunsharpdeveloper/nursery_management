# nttdatapay-nodejs
 
## Introduction
This is a demo project for Node.js, tested up to Node version 20.12.1. The project demonstrates how to implement NTT DATA Payment Gateway on your Node.js website.
 
## Prerequisites
- Node.js 
- npm (Node Package Manager)
 
## Install all the dependencies
     npm install
 
 
## Integration
1. Modify the JSON: Adjust the JSON data according to your specific requirements (e.g. (Merchant ID, Merchant Transaction ID, Amount, contact number, email, etc.).

2. Initiate API Call: After modifying the JSON, an API call will be made to the AIPAY authentication URL. Set the Auth url in accordance with UAT and Production environments.

3. Get Atom Token ID: Upon a successful response, you will receive the Atom Token ID.

4. Open Payment Page: Set the JSON CDN in accordance with UAT or Production environment. In index.html you can set the CDN where we are calling the function to open the payment page. Furthermore, the payment page will open after clicking on the Pay now option using the obtained Atom Token ID.

5. Make the Payment: Proceed with the payment on the payment page.

6. Handle the Response: Process the payment response using a response controller to verify the transaction status and handle success or failure accordingly.
 
## How to Use
1. Install all the project dependencies by running the following command:
    - npm install

2. Once the application is launched, the Atom Token ID will be fetched, and you’ll see an Atom Token ID, Transaction ID, and Amount.

3. Click the "Pay Now" button to initiate the payment process. 

4. Make the payment on the payment page. The response will be processed, and you will be redirected to the response page.