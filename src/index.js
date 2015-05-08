'use strict';

import AuthApi from './auth';

function papi(domain) {
  return {
    auth: new AuthApi(domain)
  };
}

const api = papi('https://beta-api.pressly.com');

export default papi;
