require('dotenv').config();
const Mic = require('../lib/mic');
const MumbleClientService = require('../service/MumbleClientService').MumbleClientService;
const log = require('loglevel');
if(process.env.NODE_ENV !== "production")
    log.setDefaultLevel("debug");


const CONFIG = require('../config/mumble/local');

function main() {
   const client = new MumbleClientService(CONFIG);
   client.connect()
       .then(r => {
           return client.joinChannel("Landing Channel");
       })
       .then(r => {
           client.sendMessageToCurrentChannel("Mic Client");

           let micInstance = Mic({
               rate: '88000',
               channels: '1',
               debug: true,
               device: "hw:CARD=Device,DEV=0",
               exitOnSilence: 6
           });
           const micInputStream = micInstance.getAudioStream();
           let mumbleWriteStream;

           let isPipedToMumble = false;
           micInputStream.on('data', function(data) {
               console.log("Mic Input Stream Data: " + data.length);
               if(!isPipedToMumble) {
                   isPipedToMumble = true; //Set flag to true. If no silence signal is received pipe will restart
                   setTimeout(() => {
                       if(isPipedToMumble){
                           mumbleWriteStream =client.connection.inputStream();
                           micInputStream.pipe(mumbleWriteStream);
                           log.info(`Beginning Audio Stream`);
                       }
                   }, 10);
               }
           });

           micInputStream.on('error', function(err) {
               console.log("Error in Input Stream: " + err);
           });

           micInputStream.on('silence', function() {
               console.log("Got SIGNAL silence");
               if(isPipedToMumble) {
                   micInputStream.unpipe(mumbleWriteStream); //Stop sending data to mumble client
                   isPipedToMumble = false;
                   log.info(`Stopping Audio Stream`);
               }
           });

           micInputStream.on('processExitComplete', function() {
               console.log("Got SIGNAL processExitComplete");
           });

           micInstance.start();
       })
       .catch(err => {
           log.error(err.message);
           log.error(err.stack);
       })
}

main();