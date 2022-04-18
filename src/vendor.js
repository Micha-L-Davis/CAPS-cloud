'use strict';

//#region SNS Setup
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const sns = new AWS.SNS();
const topic = 'arn:aws:sns:us-west-2:432926885510:pickup.fifo';
//#endregion

//#region SQS Setup
const { Consumer } = require('sqs-consumer');
//#endregion

//#region Other Dependencies
const Chance = require('chance');
const chance = new Chance();
//#endregion

//#region Store and Order Data
const storeName = /*process.argv[2]*/ 'acme-widgets';

class PickupOrder {
  constructor(storeName) {
    this.vendorId = storeName;
    this.orderId = chance.guid();
    this.customer = chance.name();
    this.address = `${chance.city()}, ${chance.state()}`;
    this.deliveryQueueUrl = /*process.argv[3]*/ 'https://sqs.us-west-2.amazonaws.com/432926885510/acme-widgets';
  }
}

const message = new PickupOrder(storeName);
//#endregion

//#region Consuming Message Queue
let handleDelivered = (payload) => {
  let body = payload.body;
  console.log(`Thank you, ${body}`);
};

const app = Consumer.create({
  queueUrl: /*process.argv[3]*/ 'https://sqs.us-west-2.amazonaws.com/432926885510/acme-widgets',
  handleMessage: handleDelivered,
});

app.on('error', (error) => {
  console.log('SQS Consumer Error');
  console.log(error);
});

app.start;
//#endregion

//#region Publishing Orders
const payload = {
  Message: JSON.stringify(message),
  TopicArn: topic,
  MessageGroupId: 'publish-order',
  MessageDeduplicationId: 'publish-order',
};

let sendOrder = () => {
  sns.publish(payload).promise()
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.log(error);
    });
};

setInterval(sendOrder, 3000);
//#endregion
