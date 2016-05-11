'use strict';

if (!global.Promise) {
  global.Promise = require('promiz');
}

let AbortablePromise = require('dodgy');

if (!global.fetch) {
  global.fetch = require('isomorphic-fetch');
}

// Query string parser and stringifier -- fetch does not support any query string
// parsing so we need to handle it separately.
import qs from 'querystring';

import {isEmpty} from 'lodash';

import ResourceSchema from './resource-schema';

class Papi extends ResourceSchema {
  constructor(options = {}) {
    super(...arguments);

    this.options = options;
    this.options.host = (options.host || 'https://api.pressly.com');

    this.requestMiddlewares = [];
    this.responseMiddlewares = [];

    this.metrics = {
      sendEvent: (type, message) => {
        this.request('post', `/metrix/events/${type}`, message);
      }
    }

    this.auth = {
      session: null,

      get: () => {
        return this.request('get', '/session').then((res) => {
          return this.auth.set(res.data);
        });
      },

      set: (session) => {
        if (!session.jwt) {
          throw new Error('Papi:Auth: Invalid session response - missing jwt');
        }

        this.auth.session = session;

        return this.auth.session;
      },

      isLoggedIn: () => {
        return !!this.auth.session && !this.auth.isExpired();
      },

      isExpired: () => {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: (email, password) => {
        return this.request('post', '/auth', { data: { email, password } }).then((res) => {
          return this.auth.set(res.data);
        });
      },

      requestPasswordReset: (email) => {
        return this.request('post', '/auth/password_reset', { data: {email} });
      },

      logout: () => {
        // Clear session immediately even if server fails to respond
        this.auth.session = null;

        return this.request('delete', '/session').then((res) => {
          return res;
        });
      }
    }
  }

  request(method, path, options = {}) {
    return new AbortablePromise((resolve, reject, onAbort) => {
      var url = /^(https?:)?\/\//.test(path) ? path : this.options.host + path;

      var req = {
        url: url,
        method: method,
        headers: {},
        query: {}
      }

      req.headers['Content-Type'] = 'application/json';

      // if (options.timeout || this.options.timeout) {
      //   req.timeout(options.timeout || this.options.timeout);
      // }

      // Allow sending cookies from origin
      if (typeof req.withCredentials == 'function') {
        req.credentials = 'include'
      }

      // Send Authorization header when we have a JSON Web Token set in the session
      if (this.auth.session && this.auth.session.jwt) {
        req.headers['Authorization'] = 'Bearer ' + this.auth.session.jwt
      }

      req.headers['Accept'] = 'application/vnd.pressly.v2.0+json'

      // Query params to be added to the url
      if (options.query) {
        Object.assign(req.query, options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        if (method == 'get') {
          Object.assign(req.query, options.data);
        } else {
          req.body = JSON.stringify(options.data);
        }
      }

      if (!isEmpty(req.query)) {
        req.url += '?' + qs.stringify(req.query);
      }

      var res = {};

      var beginRequest = () => {
        if (this.requestMiddlewares.length) {
          var offset = 0;
          var next = () => {
            var layer = this.requestMiddlewares[++offset] || endRequest;
            return layer(req, res, next, resolve, reject);
          };

          this.requestMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endRequest();
        }
      };

      var endRequest = () => {
        // XXX this is where the request will be made
        fetch(req.url, req).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            res = response;

            response.json().then((data) => {
              res.data = data || {};
            }).catch((err) => {
              res.data = {};
            }).then(() => {
              beginResponse();
            });
          } else {
            return reject(response);
          }
        }).catch((err) => {
          return reject(err);
        });
      };

      var beginResponse = () => {
        if (this.responseMiddlewares.length) {
          var offset = 0;
          var next = () => {
            var layer = this.responseMiddlewares[++offset] || endResponse;
            return layer(req, res, next, resolve, reject);
          };

          this.responseMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endResponse();
        }
      }

      var endResponse = () => {
        resolve(res);
      };

      onAbort((why) => {});

      beginRequest();
    });
  }

  before(middleware) {
    this.requestMiddlewares.push(middleware);
  }

  after(middleware) {
    this.responseMiddlewares.push(middleware);
  }
}

module.exports = Papi;

// <= IE10, does not support static method inheritance
if (Papi.defineSchema == undefined) {
  Papi.defineSchema = ResourceSchema.defineSchema;
}

Papi.defineSchema()
  .resource('accounts').open()
    .get('available', { on: 'resource' })
    .post('become',   { on: 'member' })

    .resource('users')
    .resource('hubs', { link: 'hubs'})
  .close()

  .resource('organizations').open()
    .resource('users')
    .resource('hubs')
    .resource('invites').open()
      .post('bulk_invite',  { on: 'resource' })
      .post('resend',       { on: 'member' })
      .put('accept',        { on: 'member', routeSegment: '/invites/:hash' })
      .put('reject',        { on: 'member', routeSegment: '/invites/:hash' })
    .close()
  .close()

  .resource('activity')

  .resource('posts', { routeSegment: '/stream/posts/:id'})

  .resource('hubs').open()
    .get('search',      { on: 'resource' })
    .post('upgrade',    { on: 'member' })
    .post('follow',     { on: 'member' })
    .delete('unfollow', { on: 'member', path: '/follow' })
    .get('reach',       { on: 'member' })

    .resource('widgets').open()
      .get('dimensions', { on: 'resource' })
    .close()

    // Readonly styles endpoint
    .get('styles', { on: 'member', path: '/apps/current/styles' })

    .resource('apps').open()
      .get('current', { on: 'resource' })
      .get('build',   { on: 'member', path: '/build_app' })
      .get('status',  { on: 'member' })

      .resource('styles')
    .close()

    .resource('addons').open()
      .resource('configs')
    .close()

    .resource('analytics').open()
      .get('summary',   { on: 'resource'})
      .get('visitors',  { on: 'resource'})
      .get('pageviews', { on: 'resource'})
      .get('duration',  { on: 'resource'})
    .close()

    .resource('feeds').open()
      .resource('assets', { modelName: 'FeedAsset' })
    .close()

    .resource('invites').open()
      .get('users',         { on: 'resource' })
      .post('bulk_invite',  { on: 'resource' })
      .post('resend',       { on: 'member' })
      .put('accept',        { on: 'member', routeSegment: '/invites/:hash' })
      .put('reject',        { on: 'member', routeSegment: '/invites/:hash' })
    .close()

    .resource('recommendations')

    .resource('users').open()
      .post('grant_access',     { on: 'resource' })
      .delete('revoke_access',  { on: 'member' })
    .close()

    .resource('collaborators',  { modelName: 'User' })

    .resource('collections').open()
      .put('reorder', { on: 'resource'})
    .close()

    .resource('tags')

    // XXX the assets endpoint will be replaced with posts shortly
    .resource('assets', { routeSegment: '/stream/:id' }).open()
      .put('feature',   { on: 'member' })
      .put('unfeature', { on: 'member' })
      .put('hide',      { on: 'member' })
      .put('unhide',    { on: 'member' })
      .put('lock',      { on: 'member' })
      .put('unlock',    { on: 'member' })

      .resource('likes')
      .resource('comments')
    .close()

    .resource('posts', { routeSegment: '/posts/published/:id'}).open()
      .resource('contributions')
    .close()

    .resource('drafts').open()
      .put('publish', { on: 'member' })
    .close()
  .close()

  .resource('invites').open()
    .get('incoming',      { on: 'resource' })
    .get('outgoing',      { on: 'resource' })
    .post('bulk_invite',  { on: 'resource' })
    .post('resend',       { on: 'member' })
    .put('accept',        { on: 'member', routeSegment: '/invites/:hash' })
    .put('reject',        { on: 'member', routeSegment: '/invites/:hash' })
  .close()

  .resource('code_revisions').open()
    .get('fetch_repo', { on: 'member' })

    // This resource links to the root hubs resource
    .resource('hubs', { link: 'hubs' })
  .close()

  .resource('signup').open()
    .get('account_uid_available',   { on: 'member' })
    .get('account_email_available', { on: 'member' })
  .close()

  .resource('users').open()
    .get('roles', { on: 'resource' })

    .resource('hubs')
    .resource('organizations')
  .close()

  .resource('discover').open()
    .resource('users',          { link: 'users'})
    .resource('organizations',  { link: 'organizations' })
    .resource('hubs',           { link: 'hubs' })
    .resource('posts')
  .close()

  .resource('creds').open()
    .post('share', { on: 'member' })
  .close()

  .resource('stream').open()
  .close()
;
