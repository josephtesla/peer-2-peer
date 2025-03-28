import Hyperswarm from 'hyperswarm';
import DHT from 'hyperdht';
import crypto from 'crypto';
import b4a from 'b4a';

const myKeyPair = DHT.keyPair();
console.log("My Public Key: ", b4a.toString(myKeyPair.publicKey, 'hex'))

const swarm = new Hyperswarm({ 
  keyPair: myKeyPair
})

// keep track of all connections and console.log incoming data
const connections = []
swarm.on('connection', connStream => {
  const name = b4a.toString(connStream.remotePublicKey, 'hex');
  console.log('* got a connection from: ', name, '*')
  connections.push(connStream);
  
  connStream.once('close', () => {
    console.log('* connection closed: ', name, '*')
    connections.splice(connections.indexOf(connStream), 1)
  })

  connStream.on('data', data => console.log(`${name}: ${data}`));
  connStream.on('error', e => console.log(`Connection error: ${e}: `, name));
})

// broadcast stdin to all connections
process.stdin.on('data', d => {
  for (const conn of connections) {
    conn.write(d);
  }
})

// Join a common topic
const args = process.argv.slice(2)
const topic = args[0] ? b4a.from(args[0], 'hex') : crypto.randomBytes(32);
const directory = swarm.join(topic, { client: true, server: true })

// The flushed promise will resolve when the topic has been fully announced to the DHT
directory.flushed().then(() => { 
  console.log('joined topic: ', b4a.toString(topic, 'hex'))
})
