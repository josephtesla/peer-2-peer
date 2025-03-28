import b4a from 'b4a'
import Hyperswarm from 'hyperswarm';
import Hypercore from 'hypercore';

const swarm = new Hyperswarm();
const core = new Hypercore('./storage');

// core.key and core.discoveryKey will only be set after core.ready resolves
await core.ready();
console.log('main hypercore key: ', b4a.toString(core.key, 'hex'));

// Append all stdin data as separate blocks to the core
process.stdin.on('data', data => {
  core.append(data)
})

// core.discoveryKey is *not* a read capability for the core
// It's only used to discover other peers who *might* have the core
const discovery = swarm.join(core.discoveryKey)
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex');
  console.log('* got a connection from: ', name, '*');

  core.replicate(conn)
})

/**
 * Waits until the topic has been fully announced to the DHT. This method is only relevant in server mode. 
 * When flushed() has completed, the server will be available to the network.
 */
discovery.flushed().then(() => { 
  console.log("joined topic (my core's discoveryKey): ", b4a.toString(core.discoveryKey, 'hex'))
})
