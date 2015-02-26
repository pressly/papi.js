import React from 'react';
import ItemList from '../components/itemList.jsx';

var Twitter = React.createClass({

  render() {
    return (
      <div>
        <h1>PAPI Twitter Search</h1>
        <ItemList />
      </div>
    );
  }

});

module.exports = Twitter;
