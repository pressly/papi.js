import React from 'react';
import Router from 'react-router';
import routes from './routes';
import Papi from 'papi';

Router.run(routes, Handler => React.render(<Handler />, document.body));
