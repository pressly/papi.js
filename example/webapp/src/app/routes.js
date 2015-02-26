import React from 'react';
import { Route, DefaultRoute, NotFoundRoute } from 'react-router';

import App from './views/app.jsx';
import Home from './views/home.jsx';
import Info from './views/info.jsx';
import Twitter from './views/twitter.jsx';
import NotFound from './views/notFound.jsx';

var routes = (
  <Route name="app" path="/" handler={ App }>
    <Route name="info" handler={ Info } />
    <Route name="home" handler={ Home } />
    <Route name="twitter" handler={ Twitter } />
    <DefaultRoute handler={ Home } />
    <NotFoundRoute handler={ NotFound } />
  </Route>
);

module.exports = routes;
