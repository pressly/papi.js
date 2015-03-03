import React from 'react';
import PresslyEmbed from '../components/presslyEmbed.jsx';

var Embed = React.createClass({

  render() {
    return (
      <div>
        <h1>Embed</h1>
        <PresslyEmbed />
      </div>
    );
  }

});

module.exports = Embed;
