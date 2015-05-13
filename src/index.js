'use strict';

import Auth from './auth';
import Hubs from './hubs';
import Users from './users';

/*
class Http {
  constructor(apiHost) {
    this.apiHost = apiHost;
    this.client = null;
    this.jwt = null;

    //_client = request.set(
  }

  setClient() {
    // set the default apiHost here...... ..
    // path ...? of the request...?
    return this.client = request.set('Authorization', 'Bearer ' + this.jwt);
  }
}
*/

class Papi {
  constructor(domain = 'https://beta-api.pressly.com', jwt = null) {
    this.session = { domain: domain, jwt: jwt };

    this.auth  = new Auth(this.session);
    this.hubs  = new Hubs(this.session);
    this.users = new Users(this.session);
  }
}

export default Papi;
