





//serial commands:
/*
frame header | data length | command word | command value | checksum | frame end
FF EE DD | 2 bytes | 1 byte | N byte | 1 byte | DD EE FF
*/

// Restore factory settings
/*
Restore to default unpartitioned mode (does not reset serial port baud rate)
Command word: 0x0A
Command value: 0x01
Return value: 1 byte (0 failure, 1 success)

send: FF EE DD 00 02 0A 01 0B DD EE FF	

*/

//set up reporting format
/*
7. Setting up the radar reporting format
Modify the format of the radar reporting data, the default is to show only whether there is a target
in the area or not
Command word: 0x02
Command value: 1 byte

we want 0x01

send: FF EE DD 00 02 02 01 03 DD EE FF
*/

//reporting happens automatically
/*
Receiving data (radar reporting format is "0x01" X coordinate value of target 1 + Y coordinate
    value of target 1 + X coordinate value of target 2 + Y coordinate value of target 2
*/



import {SerialPort} from "serialport";

const serial = new SerialPort({path: "COM6",baudRate:19200});


let targets = [];

class Target {
    constructor(x,y){
    this.x = x;
    this.y = y;
    this.present = 1;

    }
}


let buffer = [];
let currentPacket = [];
let packetLength = 0;
serial.on('data', (chunk)=>{
    //console.log(chunk);
    for (let index = 0; index < chunk.length; index++) {
        const element = chunk[index];
        //console.log("byte:" + element.toString(16));
        buffer.push(element);
        if(packetLength>0){
        if(packetLength>currentPacket.length){
            currentPacket.push(element);
        } else {
            
            let checksumReceived = currentPacket.pop();
            let checksumCalc = currentPacket.reduce((prev,cur)=>{return prev+cur}) & 0xFF;
            let checksumMatch = (checksumCalc==checksumReceived);
            console.log("packet received: "+currentPacket + " checksum match: "+checksumMatch);
            currentPacket=[];
            packetLength=0;
            buffer==[];
        }
        }

        if(buffer.length > 5){
            if(buffer[buffer.length-5]==0xFF &&buffer[buffer.length-4]==0xEE &&buffer[buffer.length-3]==0xDD){
                let length = buffer[buffer.length-1];
                packetLength=length+1; //gotta include the checksum
                console.log("got packet header! data length:", length);
            }
        }
        
    }
})

setTimeout(()=>{
    sendCommand();
},6000);

function sendCommand(commandword, dataword){
    let cmdBuffer = new Uint8Array(11);
    cmdBuffer[0]=0xFF;
    cmdBuffer[1]=0xEE;
    cmdBuffer[2]=0xDD;
    cmdBuffer[3]=0x00;
    cmdBuffer[4]=0x02;
    cmdBuffer[5]=0x02;
    cmdBuffer[6]=0x01;
    cmdBuffer[7]=0x03;
    cmdBuffer[8]=0xDD;
    cmdBuffer[9]=0xEE;
    cmdBuffer[10]=0xFF;
    serial.write(cmdBuffer);
    serial.drain((v)=>{console.log("callback called! "+v)});
    console.log("mode set!");
}
















