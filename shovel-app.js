'use strict';

var config = require('config');
var assert = require('assert');
var _ = require('lodash');
var Promise = require('bluebird');
var ikue = require('ikue');
var WorkQueueMgr = ikue.WorkQueueMgr;


var logger = require('./lib/logger');
var Shovel = require('./lib/shovel');

var allQueueMgrs = {};
var allShovels = {};

console.log(config);

function createServer(server) {
  assert.ok(server.ikue.component, 'server.ikue.component is required');
  assert.ok(server.ikue.appName, 'server.ikue.name is required');
  assert.ok(server.uri, 'server.uri is required');

  var queueMgr = new WorkQueueMgr({
    component: server.ikue.component,
    logger: logger.child({server: server.name}),
    amqp: {
      url: server.uri,
      'api_port': server.apiPort,
      clientProperties: {
        applicationName: config.get('appName')
      }
    },
    name: server.ikue.appName
  });

  logger.info('Creating queue manager for server', server.name);

  return Promise.resolve(queueMgr);
}


function connectToServer(queueMgr) {
  // Connect the queue manager, this will emit the 'ready' event when it can be used.
  queueMgr.connect();

  return Promise.fromCallback(function (callback) {
    queueMgr.on('ready', function(){
      logger.info('Connected to queue manager for server', queueMgr.name);
      callback(null, queueMgr);
    });

    queueMgr.on('error', function(error){
      throw new Error(error);
    });
  });
}

function createShovelQueues() {
  var shovels = _.values(config.shovels);
  return Promise.map(shovels, function(shovel) {
    logger.info('Creating shovel queues for shovel', shovel.name);

    assert.ok(allQueueMgrs[shovel.src.server], '[shovel.src.server] No server with name : ' + shovel.src.server);
    assert.ok(allQueueMgrs[shovel.dest.server], '[shovel.dest.server] No server with name : ' + shovel.dest.server);

    var sourceQueue = allQueueMgrs[shovel.src.server].createQueue(shovel.name + '_' + 'src');
    var destQueue = allQueueMgrs[shovel.dest.server].createQueue(shovel.name + '_' + 'dest');

    var src = {
      queue: sourceQueue,
      config: shovel.src
    };

    var dest = {
      queue: destQueue,
      config: shovel.dest
    };

    allShovels[shovel.name] = new Shovel(src, dest, shovel);
    return allShovels[shovel.name];
  });
}

function run() {
  var servers = _.values(config.servers);
  return Promise.map(servers, function (server){
    return createServer(server)
      .then(function(queueMgr) {
        allQueueMgrs[server.name] = queueMgr;
        return queueMgr;
      });
  }).then(function() {
    return createShovelQueues();
  }).then(function() {console.log(_.keys(allQueueMgrs));
    return Promise.map(_.values(allQueueMgrs), function (queueMgr){
      return connectToServer(queueMgr);
    });
  }).then(function () {
    return Promise.all(_.values(allShovels)).each(function (shovel) {
      return shovel.start();
    });
  });
}

run();

if (require.main === module) {
  setInterval(function () {

  }, 1000);
}
