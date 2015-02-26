import React from 'react';
import itemStore from '../stores/itemStore';
import itemActions from '../actions/itemActions';

var itemList = React.createClass({

  getInitialState: function() {
    return {
      items : [],
      query: '',
      loading : false,
      error : false
    }
  },

  componentDidMount: function() {
    this.unsubscribe = itemStore.listen(this.onStatusChange);
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  onStatusChange: function(state) {
    this.setState(state);
  },
  
  onInputChange: function(e) {
    this.setState({ query: e.target.value });
  },

  handleSubmit: function(e) {
    e.preventDefault();
    itemActions.loadItems(this.state.query);
  },

  render: function() {
    var loading = this.state.loading ? <div>Loading...</div> : '';
    var items = this.state.items.map(function(item, index) {
      return <li key={ item.id }>{ item.author.username } - { item.source.url }</li>
    });

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onInputChange} value={this.state.query} />
          <button>Search</button>
        </form>

        { loading }
        <ul>
          { items }
        </ul>
      </div>
    );
  }
                                     
});

module.exports = itemList;
