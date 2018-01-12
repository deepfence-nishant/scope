// React imports
import React from 'react';
import PropTypes from 'prop-types';

class D3Chart extends React.Component {
  render() {
    return (
      <svg width={this.props.width} height={this.props.height}>{this.props.children}</svg>
    );
  }
}
export default D3Chart;

D3Chart.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
};
