#!/bin/bash
export CONFPATH='/etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini';

echo > $CONFPATH;
echo "stunServerAddress=127.0.0.1" >> $CONFPATH
echo "turnURL=4649042517|wms:IAdqQGa/fzWbiUj+muW4z94fUA8=@127.0.0.1:3478" >> $CONFPATH
echo "stunServerPort=3478" >> $CONFPATH

sudo service kurento-media-server-6.0 start

sudo turnserver -v -f -n -a --no-cli --no-tls --no-dtls \
--no-loopback-peers --no-multicast-peers --secure-stun --mobility \
--use-auth-secret  --rest-api-separator '|'  \
--static-auth-secret '_%_|_%408_28*39_19^%SWIMS_|_%_' \
--realm 'alexwang.org' --external-ip $HOST &

sleep 3

node ./index.js
