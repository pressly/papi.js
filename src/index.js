'use strict';

import AuthApi from './auth';

function papi(domain) {
  return {
    auth: new AuthApi(domain)
  };
}

export default papi;
