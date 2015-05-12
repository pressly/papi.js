'use strict';

//vendor
import _ from 'underscore';
import request from 'superagent';
import jsonValidator from 'simple-json-validator';

class Resource {
  constructor(domain, route) {
    this.jwt = null;
    this.route = route;
    this.domain = domain;
    this.params = null;
    this.reRouteParams = /:[^\/:]+/gi;
  }

  $all(params = null) {
    return new Promise((resolve, reject) => {
      try {
        this.params = params;

        request
          .get(`${this.buildRoute()}`)
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${ this.jwt }`)
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
      } catch(err) {
        return reject(err);
      }
    });
  }

  $find(id) {
    return new Promise((resolve, reject) => {
      try {
        this.params = { id: id };

        request
          .get(`${this.buildRoute()}`)
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${ this.jwt }`)
          .send(this.params)
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
      } catch(err) {
        return reject(err);
      }
    });
  }

  $save(resource) {
    return new Promise((resolve, reject) => {
      try {
        this.params = { id: resource.id };


        request
          .put(`${this.buildRoute()}`)
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${ this.jwt }`)
          .send(resource)
          .end((err, res) => {
            if (err) {
              return reject(err);
            }

            resolve(res);
          });
      } catch(err) {
        return reject(err);
      }
    });
  }

  setJwt(jwt) {
    this.jwt = jwt;
  }

  buildRoute() {
    let finalRoute    = ''
      , paramsArray   = this.parseRouteParams()
      , routeSegments = this.route.split(':');

    // map params to route segments
    _.each(routeSegments, (segment, index) => {
      if (_.contains(paramsArray, segment)) {
        if (this.params) {
          routeSegments[index] = this.params[segment];
          delete this.params[segment]; // remove from global params
        } else {
          routeSegments[index] = '';
        }
      }
    });

    // concat segments
    finalRoute = `${this.domain}${routeSegments.join('')}`;

    // strip last char if forward slash
    if (finalRoute.substr(-1) === '/')
      finalRoute = finalRoute.substr(0, finalRoute.length - 1)

    return finalRoute;
  }

  parseRouteParams() {
    return _.map(this.route.match(this.reRouteParams), (param) => {
      return param.substr(1, param.length);
    });
  }
}

export default Resource;
