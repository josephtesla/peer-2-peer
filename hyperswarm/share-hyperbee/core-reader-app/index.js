import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import b4a from 'b4a'

import { Node } from 'hyperbee/lib/messages.js'

const args = process.argv.slice(2);
const key = args[0]
if (!key) throw new Error('provide a key')

// creation of a corestore instance 
const store = new Corestore('./reader-storage')

const swarm = new Hyperswarm()

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => store.replicate(conn))

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(key, 'hex') })
// wait till the properties of the hypercore instance are initialized
await core.ready()

const foundPeers = store.findingPeers()
// join a topic
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

// update the meta-data information of the hypercore instance
await core.update();

const seq = core.length - 1
const lastBlock = await core.get(core.length - 1)

// print the information about the last block or the latest block of the hypercore instance
console.log(`Raw Block ${seq}:`, lastBlock)
console.log(`Decoded Block ${seq}`, Node.decode(lastBlock))
