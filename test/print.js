var helpers = require('./helpers');

var collection = helpers.collection;
collection.aggregate([
  {
    $match: {status: 'complete', queue: helpers.queueName}
  }, {
    $group: {
      _id: {
        host: '$result',
        queue: '$queue'
      },
      dequeued: {$first: "$dequeued"},
      ended: {$last: "$ended"},
      total: {$sum: 1}
    }
  }, {
    $group: {
      _id: '$_id.queue',
      /*hosts: {
        $push: {
          host: '$_id.host',
          dequeued: '$dequeued',
          ended: '$ended',
          total: '$total'
        }
      },*/
      dequeued: {$first: '$dequeued'},
      ended: {$last: '$ended'},
      total: {$sum: '$total'}
    }
  }
], function (err, result) {
  var diff, total;
  if (err) {
    console.error(err);
  } else if (result && result.length) {
    total = result[0].total;
    diff = (result[0].ended.getTime() - result[0].dequeued.getTime());
    console.log(JSON.stringify(result, null, 2));
    console.log(total / (diff / 1000), 'per seconds');
  }
  helpers.db.close();
});