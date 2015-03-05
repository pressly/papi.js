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
  , _       = require('underscore');

// Tokens.
var devJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTQzODA0ZmIzZDNkOWQzNGI3MDAwMDAxIn0.Pcv9tTmQZnQNByS4ZItJwCIcbJ8xH-mRMPyzd-z6kGM';
var betaJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTkwIn0.3dtaAt-WIyqi5LPT4EiHGFLiU2TDD6-_sWpwZwkqcHI';
var alexJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTRmMGRiNzMwOGFmYTEyYjUzNjIwNTg4In0.CvXGDKAJYZkoH3nnEirtlGlwRzErv1ANOJ-dVkUAnjo';


/**
 * Search Provider
 *
 * Main wrapper for PAPI Search.
 */
function Provider(provider) {
  this.provider = provider;
};

/**
 * Search:
 *    GET /:provider/search?q=X
 *
 * @param {String} q - Search query
 */
Provider.prototype.search = function(q) {
  var userSearch = (q[0] == '@') ? true : false;
  if (!q) q = 'golang';

  if (userSearch) {
    return request
      .get(Papi.host + '/network/' + this.provider + '/user')
      .query({ username: q })
      .query({ jwt: Papi.jwtToken });
  }

  return request
    .get(Papi.host + '/network/' + this.provider + '/search')
    .query({ q: q })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Profile:
 *    GET /:provider/profile/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.profile = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.provider + '/profile/' + cred[0].id)
    .query({ jwt: Papi.jwtToken });
};

/**
 * Feed:
 *    GET /:provider/feed/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.feed = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.provider + '/profile')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Posts:
 *    GET /:provider/posts/:cred
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.posts = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.provider + '/user')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
};

/**
 * Post:
 *    GET /:provider/post/:cred?body=X
 *    POST /:provider/post/:cred {..obj..}
 *
 * @param {Object} cred - Papi credential
 */
Provider.prototype.post = function(cred) {
  if (!cred) throw new Error('Credentials were not specified');

  return request
    .get(Papi.host + '/network/' + this.provider + '/user')
    .query({ username: username })
    .query({ jwt: Papi.jwtToken });
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

  auth: function(jwtToken) {
    this.jwtToken = jwtToken || alexJwtToken;
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

  search: function(provider, q) {
    console.log('PAPI - Performing {' + provider + '} Search for: ' + q);
    return new Provider(provider).search(q);
  },

  profile: function(provider) {
    console.log('PAPI - Showing {' + provider + '} Profile creds');
    return new Provider(provider).profile(Papi.credentials[provider]);
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
