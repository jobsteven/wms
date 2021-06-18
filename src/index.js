// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-11 22:52:45
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-08-23 00:11:41
//  Description: uws-wsbus
// //////////////////////////////////////////////////////////////////////////////
require('babel-polyfill');

import { push, pull } from './webrtccluster.js';
import UWServer from './uwserver.js';
import MCODE from './mcode.js';
import kws, { Pub, Sub } from './kws';
import env from './env.js';
import turnKey from './turnkey.js';
import Promise from 'bluebird';

const uws = new UWServer();

const pubPeers = new Map();
const subPeers = new Map();

function clearPeer(peerId, onRelase = false) {
  if (pubPeers.has(peerId)) {
    console.log('clearPeer pub->', peerId);
    if (!onRelase) {
      pubPeers.get(peerId).release();
    }
    pubPeers.delete(peerId);
  }
  if (subPeers.has(peerId)) {
    console.log('clearPeer sub->', peerId);
    if (!onRelase) {
      subPeers.get(peerId).release();
    }
    subPeers.delete(peerId);
  }
}

function registerPeer(peer, share = true) {
  if (peer instanceof Pub) {
    pubPeers.set(peer.id, peer);
    if (share) push(peer);
  }
  if (peer instanceof Sub) {
    subPeers.set(peer.id, peer);
  }
  peer.on('OnRelease', clearPeer.bind(this, peer.id, true));
}

function getPeer(peerId) {
  if (pubPeers.has(peerId)) {
    return pubPeers.get(peerId)
  }
  if (subPeers.has(peerId)) {
    return subPeers.get(peerId);
  }
}

uws.on(MCODE.PUBLISH, ({ wsclient, data }) => {
  try {
    clearPeer(wsclient.__id);
    kws
      .createPub(data)
      .then(pubPeer => {
        const id = pubPeer.id;
        wsclient.__id = id;
        registerPeer(pubPeer);
        pubPeer.remotePeer = wsclient;
        return pubPeer.generateOffer().then(initiatorOffer => {
          const turnKeyInfo = turnKey();
          wsclient.sendJSON({
            code: MCODE.ACCESS,
            data: {
              accessId: id,
              initiatorOffer,
              iceServers: [{
                urls: `stun:${env.HOST}:${env.STUNPORT}`
              }, {
                urls: `turn:${env.HOST}:${env.STUNPORT}`,
                username: turnKeyInfo.name,
                credential: turnKeyInfo.pwd
              }]
            }
          })
        })
      })
      .catch((error) => {
        console.log('PUBLISH PROCESS ERROR->', error.message);
        wsclient.sendJSON({
          code: MCODE.ERROR,
          reason: '500 publish process error.'
        })
      })
  } catch (e) {
    wsclient.sendJSON({
      code: MCODE.ERROR,
      reason: 'Handle Exception.'
    })
  }
})

uws.on(MCODE.PLAY, ({ wsclient, data }) => {
  try {
    Promise
      .try(() => {
        const localPubPeer = pubPeers.get(data);
        if (localPubPeer) return localPubPeer;
        return pull(data)
          .then((remotePubPeer) => {
            registerPeer(remotePubPeer, false);
            return remotePubPeer;
          })
      })
      .then((pubPeer) => {
        clearPeer(wsclient.__id);
        pubPeer
          .createSub()
          .then(subPeer => {
            const id = subPeer.id;
            wsclient.__id = id;
            registerPeer(subPeer);
            subPeer.remotePeer = wsclient;
            return subPeer.generateOffer().then(initiatorOffer => {
              const turnKeyInfo = turnKey();
              wsclient.sendJSON({
                code: MCODE.ACCESS,
                data: {
                  accessId: id,
                  initiatorOffer,
                  iceServers: [{
                    urls: `stun:${env.HOST}:${env.STUNPORT}`
                  }, {
                    urls: `turn:${env.HOST}:${env.STUNPORT}`,
                    username: turnKeyInfo.name,
                    credential: turnKeyInfo.pwd
                  }]
                }
              })
            })
          })
          .catch((error) => {
            console.log('PLAY PROCESS ERROR->', error.message);
            wsclient.sendJSON({
              code: MCODE.ERROR,
              reason: '500 play process error.'
            })
          })
      })
      .catch((err) => {
        console.log('play error', err.message);
        wsclient.sendJSON({
          code: MCODE.ERROR,
          reason: 'Stream Not Exist.'
        });
      })
  } catch (e) {
    wsclient.sendJSON({
      code: MCODE.ERROR,
      reason: 'Handle Exception.'
    })
  }
})

uws.on(MCODE.SIGNAL, ({ wsclient, data }) => {
  try {
    const peer = getPeer(wsclient.__id);
    if (peer) {
      peer
        .signal(data)
        .then(resig => resig && wsclient.sendJSON({
          code: MCODE.SIGNAL,
          data: resig
        }))
        .catch((error) => {
          console.error(error);
          wsclient.sendJSON({
            code: MCODE.ERROR,
            reason: 'signal error'
          })
        })
    } else {
      wsclient.sendJSON({
        code: MCODE.ERROR,
        reason: 'Neither Play Nor Publish.'
      });
    }
  } catch (e) {
    wsclient.sendJSON({
      code: MCODE.ERROR,
      reason: 'Handle Exception.'
    })
  }
})

uws.on(MCODE.CLOSE, ({ wsclient }) => {
  try {
    clearPeer(wsclient.__id);
    wsclient.close();
  } catch (e) {
    wsclient.sendJSON({
      code: MCODE.ERROR,
      reason: 'Handle Exception.'
    })
  }
})

uws.on(MCODE.CLEAR, wsclient => clearPeer(wsclient.__id));

// statictics
setInterval(() => {
  console.log({
    clients: uws.clients.length,
    pubPeers: pubPeers.size,
    subPeers: subPeers.size
  });
}, 1500)