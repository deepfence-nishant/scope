/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import GeoMap from '../../../common/geo-map/geo-map';

class GeoMapTabView extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="geo-map-tab-view-wrapper">
        <GeoMap />
      </div>
    );
  }

}

function mapStateToProps() {
  return {};
}

export default connect(
  mapStateToProps
)(GeoMapTabView);
