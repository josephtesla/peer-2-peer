import DHT from 'hyperdht';
import b4a from 'b4a';

const dht = new DHT();

const keyPair = DHT.keyPair();

const server = dht.createServer(connStream => {
  console.log('Got Connection!')

  process.stdin
  .pipe(connStream)
  .pipe(process.stdout)
})

server.listen(keyPair).then(() => {
  // const publicKey = keyPair.publicKey;
  // console.log(publicKey);
  // console.log(b4a.toString(keyPair.publicKey));
  // console.log(b4a.toString(keyPair.publicKey, 'hex'));
  // console.log(b4a.toString(keyPair.publicKey, 'binary'));
  // console.log(b4a.toString(keyPair.publicKey, 'base64'));
  // console.log(b4a.toString(keyPair.publicKey, 'utf-8'));

  console.log('server listening on: ', b4a.toString(keyPair.publicKey, 'hex'))
})

// console.log(server);
