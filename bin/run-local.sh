# This file contains a template command to run a docker container locally
# passing server and shovels as env vars
docker run --rm -ti \
  -e Y_SERVERS_0_NAME=prod \
  -e Y_SERVERS_0_URI=amqp://user:*****@server/workers \
  -e Y_SERVERS_0_IKUE_APPNAME=Api \
  -e Y_SERVERS_0_IKUE_COMPONENT=shovels \
  \
  -e Y_SERVERS_1_NAME=stream \
  -e Y_SERVERS_1_URI=amqp://user:****@server/stream \
  -e Y_SERVERS_1_IKUE_APPNAME=Api \
  -e Y_SERVERS_1_IKUE_COMPONENT=shovels \
  \
  -e Y_SHOVELS_0_NAME=readings \
  -e Y_SHOVELS_0_SRC_WORKER_ID=event1 \
  -e Y_SHOVELS_0_SRC_SERVER=prod \
  \
  -e Y_SHOVELS_0_DEST_WORKER_ID=event1 \
  -e Y_SHOVELS_0_DEST_SERVER=stream edyn/ikue-shovel
