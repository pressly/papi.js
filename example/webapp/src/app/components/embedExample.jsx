import React from 'react';

var EmbedExample = React.createClass({

  getInitialState: function() {
    return {
      query: 'http://av.local:4444/',
      src: '',
    }
  },

  componentDidMount: function() {
    //this.unsubscribe = assetStore.listen(this.onStatusChange);
  },

  componentWillUnmount: function() {
    //this.unsubscribe();
  },

  onStatusChange: function(state) {
    this.setState(state);
  },

  onInputChange: function(e) {
    var input = e.target.value;

    this.setState({ query: input });
  },

  providerSelected: function(e) {
    this.setState({ provider: e.target.value });
  },

  handleSubmit: function(e) {
    e.preventDefault();

    this.setState({ src: this.state.query });
  },

  render: function() {
    var self = this
      , inputStyle = {
        width: '100%',
        height: 30,
        outline: 'none',
        marginBottom: 10
      };

    return (
      <div>
        <form className="embedForm" onSubmit={this.handleSubmit}>
          <input style={ inputStyle } onChange={this.onInputChange} type="text" value={this.state.query} />
        </form>

        <iframe width="100%" height="400" scrolling="no" frameBorder="no" src={this.state.src}></iframe>
      </div>
    );
  }

});

module.exports = EmbedExample;
