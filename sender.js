
const amqp = require('amqplib/callback_api');
const config = require('./config.json');

amqp.connect(config.rabbitmq.url, function(err, conn) {
  conn.createChannel(function(err, ch) {    
    var msg = {
        recipient: 'test.test@gmail.com',
        subject: 'Test Subject',
        body:'Test'
    };

    ch.assertQueue(config.rabbitmq.queue, {durable: false});
    ch.sendToQueue(config.rabbitmq.queue, new Buffer(JSON.stringify(msg)));
    console.log(" [x] Sent %s", msg);
  });
  setTimeout(function() { conn.close(); process.exit(0) }, 500);
});