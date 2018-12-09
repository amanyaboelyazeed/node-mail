//const express = require('express');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const amqp = require('amqplib/callback_api');
const config = require('./config.json');


amqp.connect(config.rabbitmq.url, function(err, conn) {
  if (closeOnErr(conn, err)) return;
  conn.createChannel(function(err, ch) {    
    ch.assertQueue(config.rabbitmq.queue, {durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", config.rabbitmq.queue);
    if (closeOnErr(conn, err)) return;
    ch.consume(config.rabbitmq.queue, function(msg) {
        if (msg.content) {            
            processMessage(msg, function(error){
                try {
                    if (error){                                                                            
                        ch.nack(msg, false, false); 
                    }
                    else {                    
                        ch.ack(msg);
                    }
                }
                catch (e){                   
                    closeOnErr(conn, e);
                }
            })                      
        }
    }, {noAck: false});
  });
});


function processMessage(msg, cb) {
    try{
        console.log("Received Message : %s", msg.content);
        var obj=JSON.parse(msg.content.toString())
    }
    catch (err){
        console.log("Invalid Message Format!");  
        cb(err);
        return;
    }  
 
    var mailOptions = {
        from: config.mail.user,
        to: obj.recipient,
        subject: obj.subject,
        text: obj.body
      };

    var transporter = nodemailer.createTransport(smtpTransport({
        service: config.mail.service,
        host: config.mail.host,
        auth: {
          user: config.mail.user,
          pass: config.mail.password
        }
    })); 
   
    transporter.sendMail(mailOptions, function(error, info){
        console.log("Send Mail to: %s", mailOptions.to);
        if (error) {
            console.log(error);
            cb(true);
        } else {
            console.log('Email sent: ' + info.response);
            cb(false);                     
        }
    });
}

function closeOnErr(amqpConn, err) {
    if (!err) return false;
    console.error("[AMQP] error", err);
    amqpConn.close();
    return true;
  }




  
 