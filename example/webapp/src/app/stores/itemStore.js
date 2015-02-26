import Papi from 'papi';
import Reflux from 'reflux';
import itemActions from '../actions/itemActions';

var itemStore = Reflux.createStore({

  init: function() {
    this.items = [];

    this.listenTo(itemActions.loadItems, this.loadItems);
    this.listenTo(itemActions.loadItemsError, this.loadItemsError);
    this.listenTo(itemActions.loadItemsSuccess, this.loadItemsSuccess);
  },

  loadItems: function(q) {
    this.trigger({ 
      loading: true
    });
    // PAPI Twitter search
    Papi.searchTwitter(q).end(function(res) {
      itemActions.loadItemsSuccess(res.body);
    });
  },

  loadItemsSuccess: function(items) {
    this.items = items;

    this.trigger({ 
      items : this.items,
      loading: false
    });
  },

  loadItemsError: function(error) {
    this.trigger({ 
      error : error,
      loading: false
    });
  }

});

module.exports = itemStore;
