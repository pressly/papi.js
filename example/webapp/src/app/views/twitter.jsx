import React from 'react';
import AssetList from '../components/assetList.jsx';

var Twitter = React.createClass({

  render() {
    return (
      <div>
        <h1>PAPI Twitter Search</h1>
        <AssetList />
      </div>
    );
  }

});

module.exports = Twitter;
