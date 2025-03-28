import Hypercore from 'hypercore';
import b4a from 'b4a';
import Hyperswarm from 'hyperswarm';

const args = process.argv.slice(2);
const keyOfWriterCore = args[0];

if (!keyOfWriterCore) {
  throw new Error(`Writer's core.key is required as a command-line argument!`);
}

const swarm = new Hyperswarm();
const core = new Hypercore('./storage', keyOfWriterCore); // now this core user will have read capability from the main core

await core.ready()

console.log("discovery key for reader: ", core.discoveryKey); 
// this should be the same as the discovery key from the writer hypercore instance
// because discovery key is created from public key

/**
 * core.findingPeers() creates a hook that tells Hypercore users are finding 
 * peers for this core in the background. we call foundPeers() 
 * when user current discovery iteration is done. If 
 * using Hyperswarm, call this after a swarm.flush() finishes.
 */
const foundPeers = core.findingPeers();

swarm.join(core.discoveryKey);
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex');
  console.log('* got a connection from: ', name, '*');

  core.replicate(conn)
})

// swarm.flush() will wait until *all* discoverable peers have been connected to
// It might take a while, so don't await it
// Instead, use core.findingPeers() to mark when the discovery process is completed
swarm.flush().then(() => foundPeers())


// This won't resolve until either
//    a) the first peer is found
// OR b) no peers could be found
await core.update()

// likewise, if this block is not available locally, the `get` will wait until
// *either* a peer connects *or* the swarm flush finishes
// await core.get(0)

let position = core.length;
console.log(`skipping ${core.length} earlier blocks...`)
for await (const block of core.createReadStream({ start: core.length, live: true })) {
  console.log(`Block ${position++}: ${block}`)
}
