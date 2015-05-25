'use strict';

require('babel/register');

import _ from 'lodash';
import request from 'superagent';

import Resource, { applyResourcing } from './resource';

export default class Papi {
  constructor(domain = 'https://beta-api.pressly.com', jwt = null) {
    this.session = { domain: domain, jwt: jwt };

    this.auth = {
      login: (email, password) => {
        return this.$request('post', '/auth/login', { email, password }).then((res) => {
          if (!res.body.jwt) {
            return Promise.reject(new Error('Papi:Auth: Invalid session response - missing jwt'));
          }

          this.session.jwt = res.body.jwt;

          return res;
        });
      },

      logout: () => {
        return this.$request('get', '/auth/logout').then((res) => {
          this.session.jwt = undefined;

          return res;
        });
      },

      session: () => {
        return this.$request('get', '/auth/session');
      }
    }
  }

  /*
    $resource(key);
    $resource(key, params);
    $resource(name, parentResource);
    $resource(name, params, parentResource);
  */
  $resource() {
    var key = arguments[0];

    if (typeof key == 'undefined') {
      throw new Error("Papi::$resource: key is undefined");
    }

    var name = _.last(key.split('.'));
    var params = (_.isObject(arguments[1]) && !(arguments[1] instanceof Resource)) ? arguments[1] : undefined;
    var parentResource = arguments[2] || (!params && arguments[1]) || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("Papi::$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    return new Resource(this, key, parentResource).includeParams(params);
  }

  $request(method, route, data) {
    return new Promise((resolve, reject) => {
      var req = request[method](this.session.domain + route);
      req.set('Content-Type', 'application/json');

      if (this.session.jwt) {
        req.set('Authorization', 'Bearer ' + this.session.jwt)
      }

      if (data) {
        req.send(data);
      }

      req.end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}

applyResourcing(Papi);

//Resource.init(Papi);

Papi
  .resource('auth')

  .resource('accounts').open()
    .resource('users')
    .resource('hubs')
  .close()

  .resource('hubs').open()
    .post('upgrade')
    .get('search', {on: 'collection'})

    .resource('apps').open()
      .resource('styles')
    .close()

    .resource('feeds').open()
      .resource('assets')
    .close()

    .resource('invites')

    .resource('recommendations')

    .resource('users')

    .resource('collections')

    .resource('tags')

    .resource('assets').open()
      .put('feature')
      .put('unfeature')

      .put('hide')
      .put('unhide')

      .put('lock')
      .put('unlock')
    .close()

    .resource('drafts')
  .close()

  .resource('code_revisions').open()
    .resource('hubs')
  .close()
