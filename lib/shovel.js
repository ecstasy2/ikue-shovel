'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

var rootLogger = require('./logger');

function Shovel(source, dest, shovelConfig) {
  this.sourceQueue = source.queue;
  this.destQueue = dest.queue;
  this.sourceConfig = source.config;
  this.destConfig = dest.config;

  this.sourceQueue.triggers = [source.config.worker_id];
  this.destQueue.triggers = ['unlikely_to_ever-exists+3421' + dest.config.worker_id];

  this.logger = rootLogger.child({
    shovelName: shovelConfig.name
  });

  this.logger.info('Creating shovel', shovelConfig.name);
}

Shovel.prototype.start = function () {
  var self = this;
  var logger = this.logger;
  var queues = [this.sourceQueue, this.destQueue];

  var sourceEvent = this.sourceConfig.worker_id;
  return Promise.map(queues, function(queue) {
    return startQueue(queue).then(function() {
      logger.info('Started queue', queue.name);
    }).catch(function (err) {
      logger.error(err, 'Failed to start queue', queue.name);
    });
  }).then(function() {

    self.sourceQueue.eventBus.on(sourceEvent, self.onJob.bind(self));
  });
};

Shovel.prototype.onJob = function (params, done) {
  var logger = this.logger;
  logger.debug({jobId: params.ikue_headers.jobId}, 'New job received');

  var destEvent = this.destConfig.worker_id;

  var headers = params['ikue_headers'];
  var job = this.destQueue.createJob(destEvent, {});

  job.data = _.omit(params, 'ikue_headers', 'id', 'workerName');
  job.delay(headers.delay);
  job.priority(headers.priority);
  job.maxRetry(headers.max_attempts);

  job.send(function(err) {
    if (err) {
      logger.error(err, 'Unable to shovel job');
      return done(err, null);
    }

    logger.trace('Job forwarded');
    return done(null, null);
  });
};

function startQueue(workQueue) {
  workQueue.start();

  return Promise.fromCallback(function (callback) {
    workQueue.once('ready', function () {
      callback(null, workQueue);
    });

    workQueue.once('error', function (error) {
      callback(error, workQueue);
    });
  })
}

module.exports = Shovel;
