// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-04-19 19:17:39
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-25 13:54:43
//  Description: wms-rtpEndpoint
//
// //////////////////////////////////////////////////////////////////////////////
import MediaElement from './mediaElement.js';

export default class RtpEndpoint extends MediaElement {
  generateOffer() {
    return this.kws
      .invoke(this.id, 'generateOffer')
      .get('value')
  }

  processAnswer(answer) {
    return this.kws
      .invoke(this.id, 'processAnswer', { answer })
      .return('')
  }

  processOffer(offer) {
    return this.kws
      .invoke(this.id, 'processOffer', { offer })
      .get('value')
  }
}