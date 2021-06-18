// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-12 20:15:30
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 18:37:59
//  Description: wms-pub
//
// //////////////////////////////////////////////////////////////////////////////
import Peer from './peer.js';
import Sub from './sub.js';
import Rec from './rec.js';
import Rtp from './rtp.js';

export default class Pub extends Peer {
  constructor(kws, mediaPipeline, webRtcEndpoint) {
    super(mediaPipeline, webRtcEndpoint);
    this.mode = 'pub';
    this.kws = kws;
    this.rec = null;
    this.on('OnRelease', this._pubOnRelease.bind(this));
  }

  release() {
    // console.log('Pub release');
    this.webRtcEndpoint.release();
    this.mediaPipeline.release();
  }

  _pubOnRelease() {
    // console.log('Pub OnRelease');
    this.kws = null;
    this.rec = null;
    this.fid = null;
  }

  createSub() {
    return this
      .kws
      .createWebRtcEndpoint(this.mediaPipeline.id)
      .then(webRtcEndpoint => this.kws.connectMediaElement(this.webRtcEndpoint.id, webRtcEndpoint.id).return(new Sub(this, webRtcEndpoint)))
  }

  createRec(audio, video) {
    this.fid = `${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}/${this.id}`;
    let profile = 'WEBW';
    if (audio && video) {
      profile = 'WEBM';
    } else if (audio) {
      profile = 'WEBM_AUDIO_ONLY'
    } else if (video) {
      profile = 'WEBM_VIDEO_ONLY';
    }
    return this
      .kws
      .createRecorderEndpoint(this.mediaPipeline.id, this.fid, profile)
      .then(recorderEndpoint => this.kws.connectMediaElement(this.webRtcEndpoint.id, recorderEndpoint.id).then(() => {
        this.rec = new Rec(this, recorderEndpoint);
        return this
      }))
  }

  createRtpO() {
    return this
      .kws
      .createRtpEndpoint(this.mediaPipeline.id)
      .then(rtpEndpoint => this.kws.connectMediaElement(this.webRtcEndpoint.id, rtpEndpoint.id).then(() => new Rtp(this, rtpEndpoint, 'pub')))
  }

  createRtpI() {
    return this
      .kws
      .createRtpEndpoint(this.mediaPipeline.id)
      .then(rtpEndpoint => this.kws.connectMediaElement(rtpEndpoint.id, this.webRtcEndpoint.id).then(() => new Rtp(this, rtpEndpoint, 'sub')))
  }
}