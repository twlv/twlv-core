const assert = require('assert');
const { Identity } = require('../identity');
const { Node } = require('../node');
const { EventEmitter } = require('events');

describe('Node', () => {
  describe('constructor', () => {
    it('create new node with generated identity', () => {
      assert(new Node().identity instanceof Identity);
    });

    it('create new node with specified identity', () => {
      let identity = Identity.generate();
      let node = new Node({ identity });
      assert.strictEqual(node.identity, identity);
    });
  });

  describe('#addReceiver()', () => {
    it('add new receiver', () => {
      let receiver = {
        on () {},
      };
      let node = new Node();
      node.addReceiver(receiver);
      assert.strictEqual(node.receivers[0], receiver);
    });

    it('up receiver when node already started', async () => {
      let receiver = {
        on () {},

        up () {
          this.upped = true;
        },
      };
      let node = new Node();

      try {
        await node.start();
        node.addReceiver(receiver);
        assert.strictEqual(node.receivers[0], receiver);
        assert.strictEqual(receiver.upped, true);
      } finally {
        try { await node.stop(); } catch (err) {}
      }
    });
  });

  describe('#removeReceiver()', () => {
    it('remove receiver', () => {
      let receiver = new EventEmitter();
      let node = new Node();
      node.addReceiver(receiver);

      assert.strictEqual(node.receivers[0], receiver);

      node.removeReceiver(receiver);
      assert.strictEqual(node.receivers.length, 0);
    });
  });

  describe('#addDialer()', () => {
    it('add new dialer', () => {
      let dialer = {};
      let node = new Node();
      node.addDialer(dialer);
      assert.strictEqual(node.dialers[0], dialer);
    });
  });

  describe('#removeDialer()', () => {
    it('remove dialer', () => {
      let dialer = new EventEmitter();
      let node = new Node();
      node.addDialer(dialer);

      assert.strictEqual(node.dialers[0], dialer);

      node.removeDialer(dialer);
      assert.strictEqual(node.dialers.length, 0);
    });
  });

  describe('#dial()', () => {
    it('invoke suitable dialer', async () => {
      let fooDialer = {
        proto: 'foo',

        dial (url) {
          this.dialedUrl = url;
          return {};
        },

        up () {
          // noop
        },

        down () {
          // noop
        },
      };

      let barDialer = {
        proto: 'bar',

        dial (url) {
          this.dialedUrl = url;
          return {};
        },

        up () {
          // noop
        },

        down () {
          // noop
        },
      };
      let node = new Node();

      node.addDialer(fooDialer);
      node.addDialer(barDialer);

      try {
        await node.start();

        await node.dial(`foo:1`);
        await node.dial(`bar:2`);

        assert.strictEqual(fooDialer.dialedUrl, 'foo:1');
        assert.strictEqual(barDialer.dialedUrl, 'bar:2');
      } finally {
        await node.stop();
      }
    });
  });

  describe('#advertisement', () => {
    it('return empty advertisement from stopped node', () => {
      let node = new Node();

      assert(!node.advertisement);
    });
    it('has address and pubKey field', async () => {
      let node = new Node();

      try {
        node.addReceiver({
          on () {},
          get urls () {
            return ['foo:1'];
          },
          up () {},
          down () {},
        });

        node.addReceiver({
          on () {},
          get urls () {
            return ['bar:1'];
          },
          up () {},
          down () {},
        });

        await node.start();

        let advertisement = node.advertisement;
        assert.strictEqual(advertisement.address, node.identity.address);
        assert.strictEqual(advertisement.pubKey, node.identity.pubKey);
        assert.strictEqual(advertisement.urls[0], 'foo:1');
        assert.strictEqual(advertisement.urls[1], 'bar:1');
      } finally {
        await node.stop();
      }
    });
  });
});
