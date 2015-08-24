var helpers = require('./helpers'),
    monq = require('../lib'),
    client = monq(helpers.uri),
    queue = client.queue(helpers.queueName, {collection: helpers.collectionName}),
    tasks = [],
    tasksTotal = helpers.tasksTotal;

function range(num) {
  var a = [];
  for (var i = 1; i <= num; i++) {
    a.push(i);
  }
  return a;
}

var queueFake = range(tasksTotal);

function enqueue() {
  var current = queueFake.shift();
  if (current) {
    queue.enqueue('sum', {text: current}, function (err, job) {
      if (err) {
        //console.error(err);
      } else {
        //console.log(job.data._id);
      }
      enqueue();
    });
  }else{
    client.db.close();
  }
}
enqueue();