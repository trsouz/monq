var assert = require('assert');
var helpers = require('./helpers');
var monq = require('../lib');

var hostname = process.env.HOSTNAME;
describe('Concurrency', function () {
  var queue, client;

  beforeEach(function () {
    client = monq(helpers.uri);
    var opts = {
      collection: helpers.collectionName
    };

    if(!helpers.withOrder){
      opts.sort = [];
    }

    queue = client.queue(helpers.queueName, opts);
  });

  afterEach(function (done) {
    this.timeout(0);
    if (client) {
      client.db.close();
      done();
    }
  });

  it('Worker', function (done) {
    this.timeout(0);

    var worker = client.worker([queue]);
    var timer;
    worker.register({
      sum: function (params, callback) {
        // clear previous timer and set new
        clearTimeout(timer);
        timer = setTimeout(function () {
          // Only call done if have no more tasks
          helpers.collection.count({status: 'queued'}, function (err, count) {
            if (!count) {
              worker.stop();
              done();
            }else{
              console.log(count);
            }
          });
        }, 1000);

        // get delay based on min and max values
        var delay = Math.random() * (helpers.max - helpers.min) + helpers.min;
        try {
          setTimeout(function () {
            callback(null, hostname);
          }, delay);
        } catch (err) {
          callback(err);
        }
      }
    });

    worker.start();
    //helpers.flushWorker(worker, done);
  });
});