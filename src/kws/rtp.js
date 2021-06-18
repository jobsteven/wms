// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-20 14:41:40
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 17:08:30
//  Description: wms-cluster
//
// //////////////////////////////////////////////////////////////////////////////
import uuid from 'uuid';

export default class Rtp {
  constructor(pub, rtpEndpoint, mode = 'pub') {
    this.mode = mode;
    this.id = uuid.v4();
    this.pub = pub;
    this.rtpEndpoint = rtpEndpoint;
    this.rtpEndpoint.on('OnRelease', this.rtpOnRelease.bind(this));
    this.pub.on('OnRelease', this.pubOnRelease.bind(this));
  }

  generateOffer() {
    return this.rtpEndpoint.generateOffer().then((offer) => {
      offer = offer.split('\r\n').reduce((modsdp, item) => {
        modsdp.push(item);
        if (item.indexOf('m=audio') === 0 || item.indexOf('m=video') === 0) {
          modsdp.push(this.mode === 'sub' ? 'a=recvonly' : 'a=sendonly')
        }
        return modsdp;
      }, []).join('\r\n')
      // console.log('generateOffer ->', offer);
      return offer;
    })
  }

  processAnswer(answer) {
    return this.rtpEndpoint.processAnswer(answer).then(() => {
      // console.log('processAnswer ->', answer);
    })
  }

  processOffer(offer) {
    return this.rtpEndpoint.processOffer(offer).then((answer) => {
      // console.log('processOffer ->', offer, answer);
      return answer;
    })
  }

  pubOnRelease() {
    // console.log('Pub OnRelease -> Rtp release');
    this.release();
  }

  release() {
    // console.log('Rtc release');
    this.rtpEndpoint.release();
  }

  rtpOnRelease() {
    // console.log('Rtp OnRelease');
    this.id = null;
    this.pub = null;
    this.rtpEndpoint = null;
  }
}