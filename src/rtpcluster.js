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
//  Last Modified time: 2017-05-25 14:23:12
//  Description: saas-rtpcluster
//
// //////////////////////////////////////////////////////////////////////////////
import IMC from 'imc';
import kws from './kws';
import Promise from 'bluebird';

const imc = new IMC({
  uid: '16660fa537d82adc73100bf790e71914',
  host: '192.168.99.1',
  port: 6060,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhaWQiOiJvc3MvajJqMGo0aWt0ZHZ4Z3M3YmZoc28iLCJvaWQiOiJqMmowajRpa3BvMGZhc2xodXk4cyIsInVyb2xlIjoic2VydmljZSIsInVpZCI6IjE2NjYwZmE1MzdkODJhZGM3MzEwMGJmNzkwZTcxOTE0IiwiY2lkIjoiZGVmYXVsdCIsImlhdCI6MTQ5NDQyMjQzMiwiZXhwIjo0NjUwMTgyNDMyfQ.r08I43YrhOkArGlCrKKApM3fEUv_kjmI4pQZHzweMWk'
});
imc.on('error', (e) => {
  console.error(e);
});
imc.on('info', (e) => {
  console.info(e);
})
imc.on(IMC.OPEN, () => {
  console.log('cluster connected');
});

function processOffer(pub, recvOffer, res) {
  pub
    .createRtpO()
    .then(rtp => rtp.processOffer(recvOffer).then((SendAnswer) => {
      res.send(SendAnswer)
    }))
    .catch((err) => {
      console.error('cluster processOffer error ->', err);
    })
}

function pushRelease(pubRec, pubId) {
  if (imc && imc.open) {
    Promise.all([
      pubRec.delete(),
      imc.rpcUnprovide(`pub/${pubId}`),
      imc.eventEmit(`pub/${pubId}`)
    ]).then(() => {
      console.log('cluster push release ->', pubId);
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
        .rpcProvide(`pub/${pub.id}`, processOffer.bind(this, pub))
        .then(() => {
          pub.on('OnRelease', pushRelease.bind(this, pubRec, pub.id));
        })
      )
      .then(() => {
        console.log('cluster push ->', pub.id);
      })
  }
}

export function pull(pubId) {
  if (imc && imc.open) {
    return imc
      .recordHas(`pub/${pubId}`)
      .then(() => kws.createPub().then((pub) => {
        pub.id = pubId;
        return pub
      }))
      .then(pub => imc
        .eventSubscribe(`pub/${pubId}`, pullRelease.bind(this, pub), true)
        .then(() => pub.createRtpI())
        .then((rtp) => rtp.generateOffer())
        .then((recvOffer) => imc
          .rpcRequest(`pub/${pubId}`, recvOffer)
          .then(() => {
            console.log('cluster pull ->', pubId);
            return pub
          })
        )
      )
  }
}