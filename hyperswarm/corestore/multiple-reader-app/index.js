import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'

const args = process.argv.slice(2);
if (!args[0]) throw new Error('provide a key (from the writer, from the first core in its corestore)');

const key = b4a.from(args[0], 'hex')

const store = new Corestore('./storage')
await store.ready()

const swarm = new Hyperswarm()

// replication of corestore instance on every connection
swarm.on('connection', (conn) => store.replicate(conn))

// creation/getting of a hypercore instance using the key passed
const core = store.get({ key, valueEncoding: 'json' })
// wait till all the properties of the hypercore instance are initialized
await core.ready()

const foundPeers = core.findingPeers()
swarm.join(core.discoveryKey)
swarm.flush().then(() => foundPeers())

// update the meta-data of the hypercore instance
await core.update()

if (core.length === 0) {
  throw new Error('Could not connect to the writer peer')
}

// getting cores using the keys stored in the first block of main core
const { otherKeys } = await core.get(0)
for (const key of otherKeys) {
  const core = store.get({ key: b4a.from(key, 'hex') })
  // on every append to each hypercore,
  // download the latest block of the core and log it to the console
  core.on('append', () => {
    const seq = core.length - 1
    core.get(seq).then(block => {
      console.log(`Block ${seq} in Core ${key}: ${block}`) 
    })
  })
}

const shutDown = async () => {
  await swarm.destroy();
}

['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => shutDown())
})
