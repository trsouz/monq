var mongoskin = require('mongoskin');
var db = require('./db');
var Job = require('./job');

module.exports = Queue;

function Queue(connection, name, options) {
    if (typeof name === 'object' && options === undefined) {
        options = name;
        name = undefined;
    }

    options || (options = {});
    options.collection || (options.collection = 'jobs');
    options.sort || (options.sort = [['priority', 'desc'], ['_id', 'asc']]);

    this.connection = connection;
    this.name = name || 'default';
    this.options = options;

    this.collection = this.connection.db.collection(this.options.collection);

    if (options.index !== false) {
        db.index(this.collection);
    }
}

Queue.prototype.job = function (data) {
    return new Job(this.collection, data);
};

Queue.prototype.get = function (id, callback) {
    var self = this;

    if (typeof id === 'string') {
        id = new mongoskin.helper.toObjectID(id);
    }

    this.collection.findOne({ _id: id, queue: this.name }, function (err, data) {
        if (err) return callback(err);

        var job = new Job(self.collection, data);
        callback(null, job);
    });
};

Queue.prototype.enqueue = function (name, params, options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    var job = this.job({
        name: name,
        params: params,
        queue: this.name,
        attempts: parseAttempts(options.attempts),
        timeout: parseTimeout(options.timeout),
        delay: options.delay,
        priority: options.priority
    });

    job.enqueue(callback);
};

Queue.prototype.dequeue = function (options, callback) {
    var self = this;

    if (callback === undefined) {
        callback = options;
        options = {};
    }

    var query = {
        status: Job.QUEUED,
        queue: this.name,
        delay: { $lte: new Date() }
    };

    if (options.minPriority !== undefined) {
        query.priority = { $gte: options.minPriority };
    }
    
    if (options.callbacks !== undefined) {
        var callback_names = Object.keys(options.callbacks);
        query.name = { $in: callback_names };
    }

    var sort = options.sort || this.options.sort;
    var update = { $set: { status: Job.DEQUEUED, dequeued: new Date() }};
    var options = { new: true };

    this.collection.findAndModify(query, sort, update, options, function (err, doc) {
        if (err) return callback(err);
        if (!doc || !doc.value) return callback();

        callback(null, self.job(doc.value));
    });
};

// Helpers

function parseTimeout(timeout) {
    if (timeout === undefined) return undefined;
    return parseInt(timeout, 10);
}

function parseAttempts(attempts) {
    if (attempts === undefined) return undefined;

    if (typeof attempts !== 'object') {
        throw new Error('attempts must be an object');
    }

    var result = {
        count: parseInt(attempts.count, 10)
    };

    if (attempts.delay !== undefined) {
        result.delay = parseInt(attempts.delay, 10);
        result.strategy = attempts.strategy;
    }

    return result;
}
