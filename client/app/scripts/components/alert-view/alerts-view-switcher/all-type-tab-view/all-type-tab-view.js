/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import ResourceBubbleChartView from './resource-bubble-chart-view/resource-bubble-chart-view';
import TreeMap from '../../../common/tree-map/tree-map';
import { getTreeMapData } from '../../../../actions/app-actions';
import { EMPTY_STATE_TEXT } from "../../../../constants/naming";

class AllTypeTabView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // Initial api call to get data
    this.retrieveTreeMapData();

    if (this.props.treeMapData) {
      this.updateTreeMap(this.props.treeMapData);
    }

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.retrieveTreeMapData();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps){
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.retrieveTreeMapData();
      }, newProps.refreshInterval.value*1000)
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    } else if (!isEqual(newProps.treeMapData, this.props.treeMapData)) {
      this.updateTreeMap(newProps.treeMapData);
    } else if ((newProps.days != this.props.days) || (newProps.searchQuery != this.props.searchQuery)) {
      this.retrieveTreeMapData(newProps.days.value.number, newProps.days.value.time_unit, newProps.searchQuery);
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({
      tree_map_data: undefined
    });
  }

  retrieveTreeMapData(number, time_unit, lucene_query) {
    let params = {
      number: number || this.props.days.value.number,
      time_unit: time_unit || this.props.days.value.time_unit,
      lucene_query: lucene_query || this.props.searchQuery
    }
    this.props.dispatch(getTreeMapData(params));
  }

  updateTreeMap(data) {
    this.setState({tree_map_data: data});
  }

  handleTreMapMouseOver(data) {
    this.setState({
      showTreeMapTooltip: true,
      name: data.target.name,
      count: data.target.value
    });
  }

  handleTreMapMouseOut() {
    this.setState({
      showTreeMapTooltip: false,
      name: '',
      count: 0
    })
  }

  handleBubbleChartMouseOver(data) {
    console.log(data)
    this.setState({
      isBubbleChartTooltipVisible: true,
      resource_type: data.resource_type,
      count: data.value
    });
  }

  handleBubbleChartMouseOut() {
    this.setState({
      isBubbleChartTooltipVisible: false,
      resource_type: '',
      count: 0
    });
  }

  // Tree map tooltip
  populateTreeMapTooltip(){
    return (
      <div className="tooltip-wrapper">
        <div className="tooltip-row">
          <div className="tooltip-key">Severity</div>
          <div className="tooltip-value">{this.state.name}</div>
        </div>
        <div className="tooltip-row">
          <div className="tooltip-key">Count</div>
          <div className="tooltip-value">{this.state.count}</div>
        </div>
      </div>
    );
  };

  // Tree map tooltip
  populateBubbleChartTooltip(){
    const keyWidth = {
      width: '100px'
    }
    return (
      <div className="tooltip-wrapper">
        <div className="tooltip-row">
          <div className="tooltip-key" style={keyWidth}>Resource</div>
          <div className="tooltip-value">{this.state.resource_type}</div>
        </div>
        <div className="tooltip-row">
          <div className="tooltip-key" style={keyWidth}>Count</div>
          <div className="tooltip-value">{this.state.count}</div>
        </div>
      </div>
    );
  };

  getTreeMapView() {
    return (
      <TreeMap onMouseOverCallback={(value) => this.handleTreMapMouseOver(value)}
               onMouseOutCallback={(value) => this.handleTreMapMouseOut(value)}
               data={this.state.tree_map_data} />
    )
  }

  getTreeMapEmptyState() {
    const emptyStateWrapper = {
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
    return(
      <div style={emptyStateWrapper}>
        <div className='empty-state-text'>{ EMPTY_STATE_TEXT }</div>
      </div>
    );
  }

  isDataAvailable(data) {
    let result;
    if (data && Object.keys(data).length > 0){
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  render() {
    return (
      <div className="all-type-view-wrapper">
        <div className='col-md-5 col-lg-5'>
          <div className="tree-map-wrapper">
            <div className="chart-heading">Alerts Tree Map</div>
            { this.isDataAvailable(this.state.tree_map_data) ? this.getTreeMapView() : this.getTreeMapEmptyState() }
            </div>
        </div>
        <div className='col-md-2 col-lg-2'>
          <div className="tab-tooltip-column">
            { this.state.showTreeMapTooltip && this.populateTreeMapTooltip() }
            { this.state.isBubbleChartTooltipVisible && this.populateBubbleChartTooltip() }
          </div>
        </div>
        <div className='col-md-5 col-lg-5'>
          <ResourceBubbleChartView onBubbleMouseOverCallback={(value) => this.handleBubbleChartMouseOver(value)}
                                   onBubbleMouseOutCallback={(value) => this.handleBubbleChartMouseOut(value)} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    treeMapData: state.get('treeMapData'),
    searchQuery: state.get('globalSearchQuery'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(AllTypeTabView);
