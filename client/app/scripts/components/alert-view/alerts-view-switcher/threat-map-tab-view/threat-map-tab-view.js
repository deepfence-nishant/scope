/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import ThreatMap from '../../../common/threat-map/threat-map';
import { maintainVisualizationData } from '../../../../utils/visualization-utils';
import { getThreatMapData } from '../../../../actions/app-actions';
import { EMPTY_STATE_TEXT } from '../../../../constants/naming';

class ThreatMapTabView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  componentDidMount() {
    this.getData(this.props.days.value.number, this.props.days.value.time_unit, this.props.searchQuery);

    // If data already present in props
    if (this.props.threatMapData) {
      this.updateThreatMapData(this.props.threatMapData);
    }

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.getData();
      }, this.props.refreshInterval.value*1000);
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps) {
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.getData();
      }, newProps.refreshInterval.value*1000);
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }
    if (this.props.days != newProps.days || (this.props.searchQuery != newProps.searchQuery)){
      this.getData(newProps.days.value.number, newProps.days.value.time_unit, newProps.searchQuery);
    } else if (!isEqual(newProps.threatMapData, maintainVisualizationData(this.props.threatMapData))){
      this.updateThreatMapData(newProps.threatMapData);
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({
      threatMapData: undefined
    })
  }

  getData(number, timeUnit, lucene_query) {
    let params = {
      number: number || this.props.days.value.number,
      time_unit: timeUnit || this.props.days.value.time_unit,
      lucene_query: lucene_query || this.props.searchQuery
    }
    this.props.dispatch(getThreatMapData(params));
  }

  updateThreatMapData(data) {
    this.setState({threatMapData: data});
  }

  getChartView() {
    return(
      <ThreatMap threatMapData={this.state.threatMapData} />
    )
  }

  getEmptyState() {
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
    if (data && data.length > 0) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  render() {
    return (
      <div className="threat-map-tab-view-wrapper">
        { this.isDataAvailable(this.state.threatMapData) ? this.getChartView() : this.getEmptyState() }
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    threatMapData: state.get('threatMapData'),
    days: state.get('alertPanelHistoryBound'),
    searchQuery: state.get('globalSearchQuery'),
    refreshInterval: state.get('refreshInterval')
  };
}


export default connect(
  mapStateToProps
)(ThreatMapTabView);


ThreatMapTabView.defaultProps = {

};
