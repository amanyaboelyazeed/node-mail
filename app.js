//const express = require('express');
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const amqp = require('amqplib')
const config = require('./config.json')

async function startProcessing() {       
    const conn = await amqp.connect(config.rabbitmq.url)
    const channel = await conn.createChannel()
    await channel.consume(config.rabbitmq.queue, async message => {
        if (message.content) {
            const processed = await processMessage(message).catch(err => console.log('Process Message Error: ', err))      
            const status = await acknowledgeMessage(channel, message, processed).catch(err => console.log('Acknowledge Message Error: ', err))
            console.log(status)
        }
    }, { noAck: false })
   
}

function processMessage(queueMsg) {
    return new Promise((resolve, reject) => {
        var msg=JSON.parse(queueMsg.content.toString())
  
        var mailOptions = {
            from: config.mail.user,
            to: msg.recipient,
            subject: msg.subject,
            text: msg.body
        }
        var transporter = nodemailer.createTransport(smtpTransport({
            service: config.mail.service,
            host: config.mail.host,
            auth: {
              user: config.mail.user,
              pass: config.mail.password
            }
        })) 
       
        transporter.sendMail(mailOptions, function(error, info){
            console.log("Send Mail to: %s", mailOptions.to)
            if (error) {
                console.log(error)
                reject(error)
            } else {
                console.log('Email sent: ' + info.response)
                resolve(true)               
            }
        })
    })   
}

function acknowledgeMessage(ch, msg, processed) {
    return new Promise((resolve) => {
        if (processed){                                                                            
            ch.ack(msg) 
            console.log('Message ACK..')       
        }
        else {
            ch.nack(msg, false, false)   
            console.log('Message NACK..')                                
        } 
        resolve('Message Processed!')   
    })
}

startProcessing()
