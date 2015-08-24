var async = require('async');
var mongo = require('mongoskin');

exports.min = +(process.env.MONQ_TEST_CONCURRENCY_DELAY_MIN || 100);
exports.max = +(process.env.MONQ_TEST_CONCURRENCY_DELAY_MAX || 1000);
exports.tasksTotal = +(process.env.MONQ_TEST_CONCURRENCY_TASKS_TOTAL || 5000);
exports.withOrder = !process.env.MONQ_TEST_CONCURRENCY_WITHOUT_ORDER;

exports.collectionName = process.env.MONQ_TEST_COLLECTION_NAME || 'jobs';
exports.queueName = process.env.MONQ_TEST_QUEUE || 'example';

exports.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monq_tests';
exports.db = mongo.db(exports.uri, { safe: true });
exports.collection = exports.db.collection(exports.collectionName);

exports.each = function (fixture, fn, done) {
    async.each(fixture, function (args, callback) {
        fn.apply(undefined, args.concat([callback]));
    }, done);
};

exports.flushWorker = function (worker, done) {
    worker.start();
    worker.once('empty', function () {
        worker.stop(done);
    });
};