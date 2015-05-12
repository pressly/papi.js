'use strict';

import Auth from './auth';
import Hubs from './hubs';
import Users from './users';

function Papi(domain) {
  return {
    auth: new Auth(domain),
    hubs: new Hubs(domain),
    users: new Users(domain),
  };
}

export default Papi;
