
var bunyan = require('bunyan');
var config = require('config');

var logLevel = config.level || bunyan.DEBUG;

var logStreams = [];

logStreams.push({
  level: logLevel,
  stream: process.stdout
});

var logger = bunyan.createLogger({
  name: config.get('appName'),
  streams: logStreams
});

module.exports = logger;
