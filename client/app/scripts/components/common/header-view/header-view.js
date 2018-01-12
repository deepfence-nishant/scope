/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

import { Tooltip } from 'react-tippy';


// Custom components imports
import SearchBox from '../alert-graph-view/search-box';
import MultiDropdown from '../alert-graph-view/multi-dropdown';

import {
  selectAlertHistoryBound, selectRefreshInterval, setSearchQuery,
  toggleFiltersView
} from '../../../actions/app-actions';
import {REFRESH_INTERVALS_OPTIONS, TIME_BOUNDARY_OPTIONS} from "../../../constants/dashboard-refresh-config";

class HeaderView extends React.Component {
  constructor() {
    super();
    this.state={}

    this.removeFilter = this.removeFilter.bind(this);
  }

  setHistoryBound(dayObj){
    this.props.dispatch(selectAlertHistoryBound(dayObj));
  }

  setRefreshInterval(intervalObj){
    this.props.dispatch(selectRefreshInterval(intervalObj));
  }

  componentDidMount(){
    if(!this.props.historyBound){
      this.props.dispatch(selectAlertHistoryBound({display: "Last 30 days", value: {number:30, time_unit:'day'}}));
    }
    if(!this.props.refreshInterval){
      this.props.dispatch(selectRefreshInterval({display: "5 seconds", value: 5}));
    }
    if (this.props.searchQuery.length > 0){

    }
  }

  populateLuceneFilters() {
    const filtersList = this.props.searchQuery.map((filter, index)=> {
      return (
        <Tooltip title={filter} position="bottom" trigger="mouseenter" key={index}>
          <div className="filter">123
            <div className="filter-name truncate">{filter}</div>
            <div className="fa fa-times filter-remove-btn" onClick={()=> this.removeFilter(index)}
                 aria-hidden="true" style={{paddingLeft: '5px'}}>
            </div>
          </div>
        </Tooltip>
      )
    })
    return filtersList;
  }

  removeFilter(filterIndex) {
    let queryCollection = JSON.parse(JSON.stringify(this.props.searchQuery));
    if (filterIndex == 0) {
      const appliedFilter = queryCollection[filterIndex].slice(1, -1);
      this.child.clearSearchBox(appliedFilter);
    }
    queryCollection.splice(filterIndex, 1);
    this.props.dispatch(setSearchQuery({searchQuery: queryCollection}));
    if (queryCollection.length === 0) {
      this.props.dispatch(toggleFiltersView());
    }
  }

  render() {
    const alertConfig = [
      {
        type: "timeBoundary",
        prefix: "Alerts from ",
        title: "Show alerts from:",
        options: TIME_BOUNDARY_OPTIONS,
        selected: this.props.historyBound || { display: "Last 30 days", value: {number:30, time_unit:'day'} },
        onSelectCallback: this.setHistoryBound.bind(this)
      },
      {
        type: "refreshInterval",
        prefix: "Refresh every ",
        title: "Refresh data every:",
        options: REFRESH_INTERVALS_OPTIONS,
        selected: this.props.refreshInterval || { display: "5 seconds", value: 5 },
        onSelectCallback: this.setRefreshInterval.bind(this)
      }
    ];

    return (
      <div className={`header-view ${this.props.isSideNavCollapsed ? 'collapse-fixed-panel' : 'expand-fixed-panel'}`}>
        <div className="alert-controls">
          <SearchBox onRef={ref => (this.child = ref)} />
          {<MultiDropdown list={alertConfig} />}
        </div>
        {this.props.isFiltersViewVisible && <div className="lucene-filters-wrapper">{this.populateLuceneFilters()}</div>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    historyBound: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval'),
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    searchQuery: state.get('globalSearchQuery'),
    isFiltersViewVisible: state.get('isFiltersViewVisible')
  };
}

export default connect(
  mapStateToProps
)(HeaderView);
