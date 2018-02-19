const assert = require('assert');
const MemoryListener = require('../../listeners/memory');
const MemoryDialer = require('../../dialers/memory');

describe('Memory listener and dialer', () => {
  beforeEach(() => {
    MemoryListener.reset();
  });

  it('caught error on dialing unknown url', async () => {
    let dialer = new MemoryDialer({ address: 'foo' });

    try {
      await dialer.dial('memory:bar');
      throw new Error('Oops');
    } catch (err) {
      if (err.message === 'Oops') {
        throw err;
      }
    }
  });

  it('listening and dialing', async () => {
    let listener = new MemoryListener({ address: '1' });
    let dialer = new MemoryDialer({ address: '2' });

    let listenerSocket;
    listener.on('socket', socket => {
      listenerSocket = socket;
    });

    let dialerSocket = await dialer.dial('memory:1');

    let listenerData;
    let listenerDataReady = new Promise(resolve => {
      listenerSocket.on('data', data => {
        listenerData = data.toString();
        resolve();
      });
    });

    let dialerData;
    let dialerDataReady = new Promise(resolve => {
      dialerSocket.on('data', data => {
        dialerData = data.toString();
        resolve();
      });
    });

    dialerSocket.write('foo');
    listenerSocket.write('bar');

    await Promise.all([ listenerDataReady, dialerDataReady ]);

    assert.equal(listenerData, 'foo');
    assert.equal(dialerData, 'bar');
  });
});