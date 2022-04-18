'use strict';

const { Consumer } = require('sqs-consumer');
const { Producer } = require('sqs-producer');

//#region Other Dependencies
const Chance = require('chance');
const chance = new Chance();
//#endregion

//#region Sending Delivery Confirmation
let handlePickup = async (payload) => {
  let body = JSON.parse(payload.Body);
  let message = JSON.parse(body.Message);
  console.log(`DRIVER: picked up order for ${message.customer}`);
  let deliveryQueueUrl = message.deliveryQueueUrl;

  setTimeout(() => { }, (Math.random() * 5000));

  const producer = Producer.create({
    queueUrl: deliveryQueueUrl,
    region: 'us-west-2',
  });

  const confirmation = {
    id: chance.guid(),
    body: JSON.stringify(message.customer),
    groupId: 'delivery-confirmed',
    deduplicationId: 'delivery-confirmed',
  };

  try {
    let response = await producer.send(confirmation);
    console.log(response);
  } catch (error) {
    console.log('SQS Producer error');
    console.log(error);
  }
};
//#endregion

//#region Consuming Message Queue
const app = Consumer.create({
  queueUrl: 'https://sqs.us-west-2.amazonaws.com/432926885510/packages.fifo',
  handleMessage: handlePickup,
});

app.on('error', (error) => {
  console.log('SQS Consumer Error');
  console.log(error);
});

app.start();
//#endregion
