/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom components imports
import AlertStatsView from '../alert-stats-view/alert-stats-view';
import AlertGraphView from '../alert-graph-view/alert-graph-view';

class TopStatsPanelView extends React.Component {
  render() {
    return (
      <div className={`top-stats-panel-wrapper ${this.props.isSideNavCollapsed ? 'collapse-side-nav' : 'expand-side-nav'} ${this.props.isFiltersViewVisible ? 'show-filters-view' : 'hide-filters-view'}`}>
        <AlertStatsView />
        <AlertGraphView />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    isFiltersViewVisible: state.get('isFiltersViewVisible')
  };
}

export default connect(
  mapStateToProps
)(TopStatsPanelView);
