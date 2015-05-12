'use strict';

import AuthApi from './auth';
//import HubsApi from './hubs';
//import UsersApi from './users';

function papi(domain) {
  return {
    auth: new AuthApi(domain),
    //hubs: new HubsApi(domain),
    //users: new UsersApi(domain),
  };
}

const api = papi('https://beta-api.pressly.com');

export default papi;
