// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-12 21:06:05
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 17:08:16
//  Description: wms-sub
//
// //////////////////////////////////////////////////////////////////////////////
import Peer from './peer.js';

export default class Sub extends Peer {
  constructor(pub, webRtcEndpoint) {
    super(pub.mediaPipeline, webRtcEndpoint);
    this.mode = 'sub';
    this.pub = pub;
    this.pub.on('OnRelease', this.pubRelease.bind(this))
    this.on('OnRelease', this._subOnRelease.bind(this));
  }

  pubRelease() {
    // console.log('Pub OnRelease -> Sub release');
    this.release();
  }

  release() {
    // console.log('Sub release');
    if (this.webRtcEndpoint) {
      this.webRtcEndpoint.release();
    }
  }

  _subOnRelease() {
    // console.log('Sub OnRelease');
    this.pub = null;
  }
}