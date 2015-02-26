import React from 'react';
import { Link } from 'react-router';

var Header = React.createClass({

  render: function() {
    return (
      <header className="clearfix">
        <span className="logo">PAPI Webapp Example</span>

        <nav className="clearfix">
          <Link to="home" className="nav-item">Home</Link>
          <Link to="info" className="nav-item">Info</Link>
          <Link to="twitter" className="nav-item">PAPI Twitter Search</Link>
        </nav>
      </header>
    );
  }

});

module.exports = Header;
