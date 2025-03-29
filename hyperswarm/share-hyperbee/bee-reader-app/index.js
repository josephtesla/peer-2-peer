import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

const args = process.argv.slice(2);
const key = args[0];

if (!key) throw new Error('provide a key')

// creation of a corestore instance 
const store = new Corestore('./storage')

const swarm = new Hyperswarm()

// replication of the corestore instance on connection with other peers
swarm.on('connection', conn => {
  const name = b4a.toString(conn.remotePublicKey, 'hex');
  console.log('* got a connection from: ', name, '*');

  store.replicate(conn)
})

// create or get the hypercore using the public key supplied as command-line argument
const core = store.get({ key: b4a.from(key, 'hex') })

// create a hyperbee instance using the hypercore instance
const bee = new Hyperbee(core, {
  keyEncoding: 'utf-8',
  valueEncoding: 'utf-8'
})

// wait till the hypercore properties to be initialized
await core.ready()

// logging the public key of the hypercore instance
console.log('core key here is:', core.key.toString('hex'))

// Attempt to connect to peers
swarm.join(core.discoveryKey)

swarm.flush().then(() => console.log("peer discovering completed"))


process.stdin.on('data', (data) => {
  const word = data.toString().trim()
  if (!word.length) return
  bee.get(word).then(node => {
    console.log({ node })
    if (!node || !node.value) console.log(`No dictionary entry for ${word}`)
    else console.log(`${word} -> ${node.value}`)
    setImmediate(console.log) // flush hack
  }, console.error)
})
