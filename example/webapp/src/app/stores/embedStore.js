import Papi from 'papi';
import Reflux from 'reflux';
import embedActions from '../actions/embedActions';

var embedStore = Reflux.createStore({
  init: function() {
    this.assets = [];

    this.listenTo(embedActions.loadAssets, this.loadAssets);
    this.listenTo(embedActions.loadAssetsError, this.loadAssetsError);
    this.listenTo(embedActions.loadAssetsSuccess, this.loadAssetsSuccess);
  },

  loadAssets: function(provider, q) {
    this.trigger({ loading: true });

    Papi.loadHubs().end(function(res) {
      var hubId = res.body[0].id;

      Papi.loadAssets(hubId).end(function(assets) {
        embedActions.loadAssetsSuccess(assets.body);
      });
    });
  },

  loadAssetsSuccess: function(assets) {
    this.assets = assets;

    this.trigger({
      assets : this.assets,
      loading: false
    });

    // init embed slider
    $('.owl-carousel').owlCarousel({
      items: 1,
      loop: true,
      dots: false,
      margin: 10,
      autoplay: true,
      autoplayTimeout: 2000,
      autoplayHoverPause: true,
      stagePadding: 10,
      itemElement: 'div',
      responsive: {
        500:  { items: 2 },
        900:  { items: 3 },
        1300: { items: 4 },
      }
    }).trigger('play.owl.autoplay');
  },

  loadAssetsError: function(error) {
    this.trigger({
      error : error,
      loading: false
    });
  }
});

module.exports = embedStore;
