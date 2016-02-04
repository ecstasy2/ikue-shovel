# Official Node image for fat version
# FROM node:argon
# Awesome tiny node image
FROM iron/base:edge

MAINTAINER Mamadou Bobo Diallo <bobo@edyn.com>

RUN echo '@edge http://nl.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories
RUN echo '@community http://nl.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories

RUN apk update && apk upgrade \
  && apk add nodejs@community \
  && rm -rf /var/cache/apk/*

# Define working directory.
WORKDIR /app

# Define default command.
CMD ["npm", "start"]

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /app/ && cp -a /tmp/node_modules /app/

ADD . /app
