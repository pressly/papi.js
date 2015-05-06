/**
  * Papi JS client
  * ================
  **/

// The first version, just write it plan javascript..
// no fancy es6, just stick to the basics

// make sure to set window.superagent ...
// ie. when using with angular.......

// Dependencies.
var request = require('superagent')
  , _       = require('underscore')
  , $q      = require('q');

// Tokens.
var devJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTQzODA0ZmIzZDNkOWQzNGI3MDAwMDAxIn0.Pcv9tTmQZnQNByS4ZItJwCIcbJ8xH-mRMPyzd-z6kGM';
var betaJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTkwIn0.3dtaAt-WIyqi5LPT4EiHGFLiU2TDD6-_sWpwZwkqcHI';
var alexJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo';


/**
 * Search Provider
 *
 * Main wrapper for PAPI Search.
 */
function SearchProvider(network) {
  if (!network) throw new Error('PAPI: network is not defined')

  this.network = network;
};

/**
 * Search:
 *    GET /network/:network/search?q=X
 *    GET /network/:network/user?username=X
 *
 * @param {String} q - Search query
 */
SearchProvider.prototype.search = function(q) {
  if (!q) throw new Error('PAPI: Search Query is not defined')
  if (!Security.isSecurityenticated()) throw new Error('PAPI: unauthorized')

  var userSearch = (q[0] == '@')

  if (userSearch) {
    return request
      .get(Papi.host + '/network/' + this.network + '/user')
      .query({ username: q })
      .query({ jwt: Papi.jwtToken });
  }

  return request
    .get(Papi.host + '/network/' + this.network + '/search')
    .query({ q: q })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Profile:
 *    GET /:network/profile/:cred
 *
 * @param {Object} cred - Papi credential
 */
SearchProvider.prototype.profile = function(cred) {
  if (!cred) throw new Error('PAPI: Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.network + '/profile/' + cred[0].id)
    .query({ jwt: Papi.jwtToken });
};


/**
 * Security
 */
function Security() {

};

Security.prototype.login = function(email, password) {
  if (!email) throw new Error('PAPI Security: Unathorized Login - Missing Email')
  if (!password) throw new Error('PAPI Security: Unathorized Login - Missing Password')

  return request
    .post(Papi.host + '/login')
    .send({ email: email, password: password })
};





/**
 * PAPI
 *
 * Pressly JS API.
 */
var Papi = {
  host: 'https://beta-api.pressly.com',
  jwtToken: null,
  credentials: null,
  currentUser: null,

  auth: function(jwtToken) {
    this.jwtToken = jwtToken || alexJwtToken;
  },

  login: function(creds) {
    var self = this;

    return $q.promise(function(resolve, reject) {
      try {
        var security = new Security();

        security.login(creds.email, creds.password).end(function(err, res) {
          resolve(self.currentUser = res.body)
        });
      } catch (e) {
        console.error(e.message)
        reject();
      }
    });
  },

  isAuthenticated: function() {
    return !!this.currentUser;
  },

  creds: function() {
    request.get(this.host + '/creds?jwt=' + this.jwtToken).end(function(res) {
      Papi.credentials = res.body;
      console.log('CREDS:', res.body);
    });
  },

  loadHubs: function() {
    return request
      .get(this.host + '/hubs')
      .query({ jwt: this.jwtToken });
  },

  loadAssets: function(hubId) {
    return request
      .get(this.host + '/hubs/' + hubId + '/stream')
      .query({ limit: 8 })
      .query({ jwt: Papi.jwtToken });
  },

  search: function(network, q) {
    var res = null

    try {
      res = new SearchProvider(network).search(q)
    } catch (e) {
      console.error(e.message);
    }

    return res;
  },

  profile: function(network) {
    console.log('PAPI - Showing {' + network + '} Profile creds');
    return new SearchProvider(network).profile(Papi.credentials[network]);
  },

  imgry: function(url, width, height, op, fp, box) {
    var params = {
      url: url,
      size: (width || '') + 'x' + (height || ''),
      op: (op || 'balance')
    };

    if (fp)  { params.fp = _.toArray(fp).join(',') }
    if (box) { params.box = _.toArray(box).join(',') }

    // convert params into url hash
    imgryUrl = '//imgry.pressly.com/xx2/fetch?' + _(_(_(params).pairs()).map(function (e) {
      return _(e).join('=')
    })).join('&');

    return imgryUrl;
  }
};

module.exports = Papi;

Papi.login({ email: 'alex.vitiuk@pressly.com', password: 'betame' }).then(function(res) {
  console.log('LOGIN SUCCESS', res);
});
