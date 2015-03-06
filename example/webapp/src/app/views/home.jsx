import React from 'react';
import EmbedExample from '../components/embedExample.jsx';

var Home = React.createClass({

  render() {
    return (
      <div className="container">
        <h1>Embed Example:</h1>
        <EmbedExample />
      </div>
    );
  }

});

module.exports = Home;
