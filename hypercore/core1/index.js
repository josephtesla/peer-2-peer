import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import crypto from 'crypto';
import fs from 'fs';

fs.rmSync('./directory', { recursive: true, force: true });

const key = crypto.randomBytes(32);
console.log({ key });

const core = new Hypercore('./directory', {
  createIfMissing: true, // reate a new Hypercore key pair if none was present in the storage
  overwrite: false, // overwrite any old Hypercore that might already exist
  sparse: true,
  valueEncoding: 'utf-8', // defaults to binary
  // encryptionKey: Buffer.from('samplekey') // optionally pass an encryption key to enable block encryption
});

/**
 * ℹ️ In general, waiting for ready is unnecessary unless there's a 
 * need to check a synchronous property (like key or discoverykey) 
 * before any other async API method has been called. 
 * All async methods on the public API, await ready internally.
 */

core.ready()
  .then(async () => {
    // const { length, byteLength} = await core.append('block of data');
    // console.log({ length, byteLength });

    // console.log(await core.get(0)) // get data in first block    

    console.log('core.readable: ', core.readable)
    console.log('core.id: ', core.id)
    console.log('core.key: ', core.key)
    // console.log('core.keyPair: ', core.keyPair)
    // console.log('core.discoveryKey: ', core.discoveryKey)
    // console.log('core.encryptionKey: ', core.encryptionKey)
    // console.log('core.writable: ', core.writable)
    // console.log('core.length: ', core.length)
    // console.log('core.contiguousLength: ', core.contiguousLength)
    // console.log('core.padding: ', core.padding)

    // await core.append('I am a block of data')
    // console.log("second block data: ", await core.get(1))
    // console.log('core.length: ', core.length)

    // console.log('core.has(0,2): ', await core.has(0,2)) // true. just like array indexing. from start - end-1
    // console.log('core.has(2): ', await core.has(2)) // false

    // const updated = await core.update()
    // console.log('core was updated?', updated, 'length is', core.length)

    // for (let i = 1; i <= 20; i++) {
    //   await core.append(`DATA_${i}`)
    // }

    // console.log('core.length: ', core.length)

    // const fullStream = core.createReadStream()
    // const partialStream = core.createReadStream({ start: 10, end: 15 }); // read from block 10-14

    // // pipe the stream somewhere using the .pipe method
    // // or consume it as an async iterator

    // for await (const data of fullStream) {
    //   console.log('block entry: ', data)
    // }

    // // partialStream.pipe(process.stdout)

    // //     // Read the full core
    // // const fullStream2 = core.createByteStream()
    // // // Read from byte 3, and from there read 50 bytes
    // // const partialStream2 = core.createByteStream({ byteOffset: 3 })
    // // // Consume it as an async iterator
    // // for await (const data of fullStream2) {
    // //   console.log('data:', data)
    // // }
    // // // Or pipe it somewhere like any stream:
    // // partialStream2.pipe(process.stdout)

    // // console.log("core.clear(0, 10): ", await core.clear(0, 10));
    // console.log("core.length: ", core.length)
    // // console.log("core.truncate(10): ", await core.truncate(10));
    // console.log("core.length: ", core.length)

    // const fullStream2 = core.createReadStream()
    // for await (const data of fullStream2) {
    //   console.log('block entry: ', data)
    // }

    // // console.log("core.purge: ", await core.purge());
    // // console.log("core.length: ", core.length) 

    // console.log('core.treeHash(): ', await core.treeHash())
    // console.log('core.treeHash(): ', await core.treeHash(5)) // up to length 5

    // // const range = core.download({ start: 0 })
    // // console.log(await range.done());

    // // const session = await core.session()
    // // console.log({ session })

    // console.log("core.info()", await core.info({
    //   storage: true
    // }))

    const db = new Hyperbee(core, {
      valueEncoding: 'utf-8',
      keyEncoding: 'utf-8'
    })

    console.log("db ", db)
    console.log("db.core ", db.core)
    console.log("db.version ", db.version)
    console.log("db.id ", db.id)
    console.log("db.key ", db.key.toString('hex'))
    console.log("db.discoveryKey ", db.discoveryKey.toString('hex'))
    console.log('db.writable: ', db.writable)
    console.log('db.readable: ', db.readable)

    await db.put('number', '123', { cas: putComparator })
    console.log(await db.get('number')) // => { seq: 1, key: 'number', value: '123' }

    await db.put('number', '123', { cas: putComparator })
    console.log(await db.get('number')) // => { seq: 1, key: 'number', value: '123' }
    // Without cas this would have been { seq: 2, ... }, and the next { seq: 3 }    

    await db.put('number', '456', { cas: putComparator })
    console.log(await db.get('number')) // => { seq: 2, key: 'number', value: '456' }

    function putComparator(prev, next) {
      return prev.value !== next.value
    }

    // This won't get deleted
    await db.del('number', { cas: deleteComparator })
    console.log(await db.get('number')) // => { seq: 1, key: 'number', value: 'value' }

    // Change the value so the next time we try to delete it then "cas" will return true
    await db.put('number', 'can-be-deleted')

    await db.del('number', { cas: deleteComparator })
    console.log(await db.get('number')) // => null

    console.log("db.getBySeq(1)", await db.getBySeq(1))

    function deleteComparator(prev) {
      // return true;
      return prev?.value === 'can-be-deleted'
    }

    await db.put('alice', 500)
    await db.put('bob', '395')
    await db.put('dexter', '700')
    const stream = db.createReadStream({
      reverse: false,
      limit: -1
    })

    for await (const data of stream) {
      console.log(data)
    }

    console.log("db.peek(): ", await db.peek())

    console.log(db.core.length)
    const historyStream = db.createHistoryStream({
      live: true,
      reverse: false,
      // gte: db.version - skips all 
      // gte: -1, last index
    })

    console.log("reading history stream")
    for await (const data of historyStream) {
      console.log(data)
    }

    const watcher = db.watch()
    for await (const [current, previous] of watcher) {
      console.log(current.version)
      console.log(previous.version)
    }
  })
