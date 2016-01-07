'use strict';

import nock from 'nock'; // Needs to be imported first before papi because it overrides http and so does node-fetch

import Papi from '../../src';
import * as mock from './mocks';
import should from 'should';
import * as models from '../../src/models';
import _ from 'lodash';

const api = new Papi();

// api.before((req, res, next) => {
//   console.log("A")
//   res.body = "hello";
//   next();
// });
//
// api.before((req, res, next) => {
//   console.log("B", res.body);
//   next();
// })
//
// api.before((req, res, next) => {
//   console.log("C");
//   next();
// });
//
// api.before((req, res, next, resolve, reject) => {
//   console.log("D")
//   if (req.method == 'DELETE') {
//     reject(new Error("401 Not Found"));
//   } else {
//     next();
//   }
// });
//
// api.after((req, res, next, resolve, reject) => {
//   console.log("F");
//   next();
// });
