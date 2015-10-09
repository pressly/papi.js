'use strict';

import _ from 'lodash';
import request from 'superagent';
import Promise from 'bluebird';
import ResourceSchema from './resource-schema';

function hasXDomain() {
  return typeof window !== 'undefined' && window.xdomain != null;
}

export default class Papi extends ResourceSchema {
  constructor(options = {}) {
    super(...arguments);

    this.options = options;
    this.options.host = (options.host || 'https://beta-api.pressly.com');

    if (hasXDomain()) {
      var slaves = {};
      slaves[this.options.host] = '/proxy.html';
      window.xdomain.slaves(slaves);
    }

    this.callbacks = [];

    this.auth = {
      session: null,

      get: () => {
        return this.request('get', '/session').then((res) => {
          return this.auth.set(res.body);
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
        return this.request('post', '/auth/login', { data: { email, password } }).then((res) => {
          return this.auth.set(res.body);
        });
      },

      logout: () => {
        return this.request('delete', '/session').then((res) => {
          this.auth.session = null;

          return res;
        });
      }
    }
  }

  request(method, path, options = {}) {
    return new Promise((resolve, reject) => {
      var url = /^(https?:)?\/\//.test(path) ? path : this.options.host + path;

      // Doesn't allow the delete keyword because it is reserved
      if (method == 'delete') {
        method = 'del';
      }

      var req = request[method](url);

      req.set('Content-Type', 'application/json');

      if (options.timeout || this.options.timeout) {
        req.timeout(options.timeout || this.options.timeout);
      }

      // Allow sending cookies from origin
      if (typeof req.withCredentials == 'function' && !hasXDomain()) {
        req.withCredentials();
      }

      // Send Authorization header when we have a JSON Web Token set in the session
      if (this.auth.session && this.auth.session.jwt) {
        req.set('Authorization', 'Bearer ' + this.auth.session.jwt)
      }

      req.set('Accept', 'application/vnd.pressly.v0.12+json')

      // Query params to be added to the url
      if (options.query) {
        req.query(options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        req.send(options.data);
      }

      //console.log(req.url)

      req.end((err, res) => {
        setTimeout(() => {
          _.each(this.callbacks, (cb) => {
            cb(res);
          });
        });

        if (err) {
          return reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  // Register callback to fire after each request finishes
  // returns a deregister function.
  on(callback) {
    this.callbacks.push(callback);

    return () => {
      this.off(callback);
    };
  }

  off(callback) {
    let idx = this.callbacks.indexOf(callback);

    if (idx >= 0) {
      this.callbacks.splice(idx, 1);
    }
  }
}

// <= IE10, does not support static method inheritance
if (Papi.defineSchema == undefined) {
  Papi.defineSchema = ResourceSchema.defineSchema;
}

Papi.defineSchema()
  .resource('accounts').open()
    .get('available', { on: 'resource' })
    .post('become',   { on: 'member' })

    .resource('users')
    .resource('hubs', { linkTo: 'hubs'})
  .close()

  .resource('organizations').open()
    .resource('users')
    .resource('hubs')
    .resource('invites')
  .close()

  .resource('posts', { routeSegment: '/stream/posts/:id'})

  .resource('hubs').open()
    .get('search',    { on: 'resource' })
    .post('upgrade',  { on: 'member' })
    .post('accept_invite', { on: 'member'})
    .post('reject_invite', { on: 'member'})

    .resource('apps').open()
      .get('current', { on: 'resource', path: '/current' })
      .get('build',   { on: 'member', path: '/build_app' })
      .get('status',  { on: 'member' })

      .resource('styles')
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
      .post('bulk_invite',  { on: 'resource' })
      .post('resend',       { on: 'member' })
      .post('accept',       { on: 'member', routeSegment: '/invites/:hash' })
      .post('reject',       { on: 'member', routeSegment: '/invites/:hash' })
    .close()

    .resource('recommendations')

    .resource('users').open()
      .post('grant_access',     { on: 'resource' })
      .delete('revoke_access',  { on: 'member' })
    .close()

    .resource('collections').open()
      .put('reorder', { on: 'resource'})
    .close()

    .resource('tags')

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

    .resource('drafts').open()
      .put('publish', { on: 'member' })
    .close()
  .close()

  .resource('invites').open()
    .get('incoming',      { on: 'resource' })
    .get('outgoing',      { on: 'resource' })
    .post('bulk_invite',  { on: 'resource' })
    .post('resend',       { on: 'member' })
    .post('accept',       { on: 'member', key: 'hash' })
    .post('reject',       { on: 'member', key: 'hash' })
  .close()

  .resource('code_revisions').open()
    .get('fetch_repo', { on: 'member' })

    // This resource links to the root hubs resource
    .resource('hubs', { linkTo: 'hubs' })
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
;
