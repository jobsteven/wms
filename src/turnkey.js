// //////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2016-present  All Rights Reserved.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Github Home: https://github.com/jobsteven
//  Author: AlexWang
//  Date: 2017-05-22 16:54:27
//  QQ Email: 1669499355@qq.com
//  Last Modified time: 2017-05-22 17:05:41
//  Description: saas-turnkey
//
// //////////////////////////////////////////////////////////////////////////////

import env from './env.js';
import crypto from 'crypto';
import ms from 'ms';

export default function getTurnKey(username = 'wms', expirems = ms('8h')) {
  const unixTimeStamp = Math.ceil((Date.now() + expirems) / 1000);
  const usernamecom = [unixTimeStamp, username].join('|');
  const hmac = crypto.createHmac('sha1', env.KEY);
  hmac.setEncoding('base64');
  hmac.write(usernamecom);
  hmac.end();
  return {
    name: usernamecom,
    pwd: hmac.read()
  };
}