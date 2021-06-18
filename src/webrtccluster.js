// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-05-23 16:26:12
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-08-26 22:11:07
//  Description: saas-webrtcREGISTER
//
// //////////////////////////////////////////////////////////////////////////////
import kws from './kws';
import env from './env.js';
import IMC from 'imc';
import Promise from 'bluebird';

let imc = null;
if (env.REGISTER) {
  imc = new IMC({
    uid: '0789387b-165c-4e5a-adc2-d51e0ca49e29',
    host: env.REGISTER,
    port: env.REGPORT,
    ssl: parseInt(env.REGPORT, 10) === 443,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIwNzg5Mzg3Yi0xNjVjLTRlNWEtYWRjMi1kNTFlMGNhNDllMjkiLCJyb2xlIjoic3ZjIiwidWlkIjoiMDc4OTM4N2ItMTY1Yy00ZTVhLWFkYzItZDUxZTBjYTQ5ZTI5IiwibmFtZSI6IndlYnJ0Y19jbHVzdGVyIiwiaWF0IjoxNTAzMjEzMDIzLCJleHAiOjM0OTEzNjM0MjN9.9zjrBsvkunQYf9VpvTL7SdETcDCugR4ntANWBLeUlJs'
  });
  imc.on('error', (e) => {
    console.error(e);
  });
  imc.on('info', (e) => {
    console.info(e);
  })
  imc.on(IMC.OPEN, () => {
    console.log('REGISTER connected');
  });
  console.log('*********REGISTER mode********');
} else {
  console.log('*********signal mode********');
}

function generateOffer(pub, subPeerId, res) {
  if (imc && imc.open) {
    pub
      .createSub()
      .then(sub => sub.generateOffer().then((offer) => {
        const pubPeerId = `pub/${pub.id}:${sub.id}`;
        sub.remotePeer = {
          sendJSON: (msg) => {
            if (msg.code === 'close') {
              imc.eventEmit(subPeerId);
            }
            if (msg.code === 'signal') {
              imc.eventEmit(subPeerId, msg.data);
            }
          }
        }
        imc.eventSubscribe(pubPeerId, (sig) => {
          if (sig) {
            return sub.signal(sig)
          }
        })
        res.send({ pubPeerId, offer });
        console.log('REGISTER generateOffer ', subPeerId);
      }))
      .catch((err) => {
        console.error('REGISTER generateOffer error ->', err);
      })
  }
}

function pushRelease(pubRec, pubId) {
  if (imc && imc.open) {
    Promise.all([
      pubRec.delete(),
      imc.rpcUnprovide(`pub/${pubId}`),
      imc.eventEmit(`pub/${pubId}`)
    ]).then(() => {
      console.log('REGISTER push release ->', pubId);
    })
  }
}

function pullRelease(pub) {
  console.log('Pull Release ->', pub.id);
  pub.release();
}

export function push(pub) {
  if (imc && imc.open) {
    imc
      .recordGet(`pub/${pub.id}`)
      .then((pubRec) => imc
        .rpcProvide(`pub/${pub.id}`, generateOffer.bind(this, pub))
        .then(() => {
          pub.on('OnRelease', pushRelease.bind(this, pubRec, pub.id));
        })
      )
      .then(() => {
        console.log('REGISTER push ->', pub.id);
      })
  }
}

export function pull(pubId) {
  if (imc && imc.open) {
    return imc
      .recordHas(`pub/${pubId}`)
      .then(() => kws.createPub())
      .then((pub) => imc.eventSubscribe(`pub/${pubId}`, pullRelease.bind(this, pub), true).return(pub))
      .then(pub => {
        const subPeerId = `pub/${pubId}:${pub.id}`;
        return imc
          .rpcRequest(`pub/${pubId}`, subPeerId)
          .then(({ offer, pubPeerId }) => {
            pub.remotePeer = {
              sendJSON: (msg) => {
                if (msg.code === 'close') {
                  imc.eventEmit(pubPeerId);
                  imc.eventUnsubscribe(subPeerId);
                }
                if (msg.code === 'signal') {
                  imc.eventEmit(pubPeerId, msg.data);
                }
              }
            }
            imc.eventSubscribe(subPeerId, (sig) => {
              if (sig) {
                return pub.signal(sig)
              }
            })
            return pub.signal(offer).then((answer) => {
              imc.eventEmit(pubPeerId, answer)
            })
          })
          .then(() => {
            pub.id = pubId;
            console.log('REGISTER pull ->', pub.id);
            return pub
          })
      })
  }
}