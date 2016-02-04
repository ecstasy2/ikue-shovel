iKue Shovel
===================

ikue-shovel is a utility that allow the shoveling of ikue based jobs from/to any combination of the following:

  - Rabbitmq server
  - Rabbitqm vhost
  - iKue message queue to another

To configure it, create a file `config/$NODE_ENV.yml` where `$NODE_ENV` is the environment you are going to deploy to.

The file should be similar to the following:

````yml
appName: Edyn Shovels
servers:
  - name: production
    uri: amqp://user:password@rabbitmq.server/logs

    ikue:
      appName: AppName
      component: shovels

  - name: stream
    uri: amqp://user:password@rabbitmq.server/stream

    ikue:
      appName: LogProcessor
      component: shovels

    shovels:
      - name: default
        src:
          worker_id: readings:new_batch
          server: prod
    
        dest:
          worker_id: sensors:update_graph
          server: stream
    shovels:
      - name: default
        src:
          worker_id: new:log
          server: prod
    
        dest:
          worker_id: new:log
          server: stream
````

With the above configuration, ikue-shovel will forward any incoming log from the production broker and forward it to a different `vhost` to be processed.

You can define as many forwarding rules and servers as you want. In the above example we are just using two servers and only one forwarding rule.

### Build the docker image

This repo come with a docker micro-image (an impressive 25MB) that you can build and deploy instead.

#### Use environment variables to confirure

For simple use cases you can use environment variables to configure ikue-shovel without having to create a configuration file.
This is very useful when you want to run from the generic docker image directly (which don't contain any configuration).

**Example: **
    
````bash
docker run --rm -ti \
  -e Y_SERVERS_0_NAME=prod \
  -e Y_SERVERS_0_URI=amqp://user:*****@server/workers \
  -e Y_SERVERS_0_IKUE_APPNAME=Api \
  -e Y_SERVERS_0_IKUE_COMPONENT=shovels \
  -e Y_SERVERS_1_NAME=stream \
  -e Y_SERVERS_1_URI=amqp://user:****@server/stream \
  -e Y_SERVERS_1_IKUE_APPNAME=Api \
  -e Y_SERVERS_1_IKUE_COMPONENT=shovels \
  -e Y_SHOVELS_0_NAME=readings \
  -e Y_SHOVELS_0_SRC_WORKER_ID=event1 \
  -e Y_SHOVELS_0_SRC_SERVER=prod \
  -e Y_SHOVELS_0_DEST_WORKER_ID=event1 \
  -e Y_SHOVELS_0_DEST_SERVER=stream ikue/shovel
````

With the above command ikue-shovel will setup a forwarding rule from one server to another.


