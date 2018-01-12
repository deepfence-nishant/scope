/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';

import D3DonutChart from "../../../common/donut-chart/donut-chart";

import { getDonutDetails } from '../../../../utils/web-api-utils';
import {isDataAvailable, legendEdgeCaseCheck} from '../../../../utils/visualization-utils';
import {EMPTY_STATE_TEXT} from "../../../../constants/naming";

function getOrderedData(donutType, data) {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const anomalyOrder = ['behavioral_anomaly', 'syscall_anomaly', 'system_audit', 'network_anomaly'];
  const resourceOrder = ['processes', 'files', 'network'];
  const result = {};
  if (donutType === 'severity'){
    severityOrder.forEach(function (item) {
      for (let key in data){
        if (item == key){
          result[key] = data[key];
        }
      }
    })
  } else if (donutType === 'anomaly'){
    anomalyOrder.forEach(function (item) {
      for (let key in data){
        if (item == key){
          result[key] = data[key];
        }
      }
    })
  } else if (donutType === 'resource_type'){
    resourceOrder.forEach(function (item) {
      for (let key in data){
        if (item == key){
          result[key] = data[key];
        }
      }
    })
  }
  return result;
}

function getDonutLegendsFormat(donutType, metaData) {
  const donutMetaData = getOrderedData(donutType, metaData);
  let donutDataFormat = {};
  const donutData = [];
  donutDataFormat['donut_name'] = donutType;
  for(const key in donutMetaData) {
    donutData.push({key_name: key, key_value: 0, isChecked: true});
  }
  donutDataFormat['donut_details'] = donutData;
  return donutDataFormat;
}

function getDonutDataFormat(donutType, metaData) {
  const donutMetaData = getOrderedData(donutType, metaData);
  let donutDataFormat = {};
  const donutData = [];
  donutDataFormat['donut_name'] = donutType;
  for(const key in donutMetaData) {
    donutData.push({key_name: key, key_value: donutMetaData[key], isVisible: true});
  }
  donutDataFormat['donut_details'] = donutData;
  return donutDataFormat;
}

class DonutTabView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // Initial api call to get the data
    this.callDonutApi();

    // If data is present then update the view
    if (this.props.resourceDonutDetails && this.props.anomalyDonutDetails && this.props.resourceDonutDetails) {
      let params = {
        severityData: this.props.severityDonutDetails,
        anomalyData: this.props.anomalyDonutDetails,
        resourceData: this.props.resourceDonutDetails
      };
      this.updateDonutView(params);
    }

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.callDonutApi();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps) {
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.callDonutApi();
      }, newProps.refreshInterval.value*1000)
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }

    if ((newProps.days != this.props.days) || (newProps.searchQuery != this.props.searchQuery)) {
      this.callDonutApi(newProps.days.value.number, newProps.days.value.time_unit, newProps.searchQuery);
    } else if (!isEqual(newProps.severityDonutDetails, this.props.severityDonutDetails) ||
      !isEqual(newProps.anomalyDonutDetails, this.props.anomalyDonutDetails) ||
      !isEqual(newProps.resourceDonutDetails, this.props.resourceDonutDetails)) {
      let params = {
        severityData: newProps.severityDonutDetails,
        anomalyData: newProps.anomalyDonutDetails,
        resourceData: newProps.resourceDonutDetails
      }
      this.updateDonutView(params);
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({
      severityDonutData: undefined,
      severityLegends: undefined,
      anomalyDonutData: undefined,
      anomalyLegends: undefined,
      resourceDonutData: undefined,
      resourceLegends: undefined
    });
  }

  updateDonutView(params) {
    // Severity Donut
    this.initializeLegends(getDonutLegendsFormat('severity', params.severityData));
    this.initializeDonuts(getDonutDataFormat('severity', params.severityData));

    // Anomaly Donut
    this.initializeLegends(getDonutLegendsFormat('anomaly', params.anomalyData));
    this.initializeDonuts(getDonutDataFormat('anomaly', params.anomalyData));

    // Resource Type Donut
    this.initializeLegends(getDonutLegendsFormat('resource_type', params.resourceData));
    this.initializeDonuts(getDonutDataFormat('resource_type', params.resourceData));
  }

  callDonutApi(number, timeUnit, lucene_query) {
    if (this.props.days || number) {
      let params = {
        number: number || this.props.days.value.number,
        time_unit: timeUnit || this.props.days.value.time_unit,
        lucene_query: lucene_query || this.props.searchQuery
      }
      getDonutDetails(this.props.dispatch, 'severity', params);
      getDonutDetails(this.props.dispatch, 'anomaly', params);
      getDonutDetails(this.props.dispatch, 'resource_type', params);
    }
  }

  initializeLegends(donutLegendsDetails) {
    if (donutLegendsDetails.donut_name === 'severity') {
      this.setState({severityLegends: donutLegendsDetails.donut_details});
    } else if (donutLegendsDetails.donut_name === 'anomaly') {
      this.setState({anomalyLegends: donutLegendsDetails.donut_details});
    } else if (donutLegendsDetails.donut_name === 'resource_type') {
      this.setState({resourceLegends: donutLegendsDetails.donut_details});
    }
  }

  initializeDonuts(donutData) {
    if (donutData.donut_name === 'severity') {
      this.setState({severityDonutData: donutData});
    } else if (donutData.donut_name === 'anomaly') {
      this.setState({anomalyDonutData: donutData});
    } else if (donutData.donut_name === 'resource_type') {
      this.setState({resourceDonutData: donutData});
    }
  }

  // Donut legends single click handler
  handleSingleClick(value) {
    this.updateDonutOnSingleClick(value);
  }

  // Donut legends double click handler
  handleDoubleClick(value) {
    this.updateDonutOnDoubleClick(value);
  }

  // Method to update donut on legend single click
  updateDonutOnSingleClick(selectedSector) {
    if (Object.keys(selectedSector)[0] === 'severity') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.severityDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          if (availableSector.isVisible) {
            availableSector.isVisible = false;
          } else {
            availableSector.isVisible = true;
          }
        }
      });
      this.setState({severityDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.severityLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          if (selectedLegend.isChecked) {
            selectedLegend.isChecked = false;
          } else {
            selectedLegend.isChecked = true;
          }
        }
      });
      this.setState({severityLegends: activeDonutLegends});

      const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.severityDonutData.donut_details)));
      if (isEdgeCase) {
        this.initializeDonuts(getDonutDataFormat('severity', this.props.severityDonutDetails));
        this.initializeLegends(getDonutLegendsFormat('severity', this.props.severityDonutDetails));
      }
    } else if (Object.keys(selectedSector)[0] === 'anomaly') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.anomalyDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          if (availableSector.isVisible) {
            availableSector.isVisible = false;
          } else {
            availableSector.isVisible = true;
          }
        }
      });
      this.setState({anomalyDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.anomalyLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          if (selectedLegend.isChecked) {
            selectedLegend.isChecked = false;
          } else {
            selectedLegend.isChecked = true;
          }
        }
      });
      this.setState({anomalyLegends: activeDonutLegends});

      const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.anomalyDonutData.donut_details)));
      if (isEdgeCase) {
        this.initializeDonuts(getDonutDataFormat('anomaly', this.props.anomalyDonutDetails));
        this.initializeLegends(getDonutLegendsFormat('anomaly', this.props.anomalyDonutDetails));
      }
    } else if (Object.keys(selectedSector)[0] === 'resource_type') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.resourceDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          if (availableSector.isVisible) {
            availableSector.isVisible = false;
          } else {
            availableSector.isVisible = true;
          }
        }
      });
      this.setState({resourceDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.resourceLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          if (selectedLegend.isChecked) {
            selectedLegend.isChecked = false;
          } else {
            selectedLegend.isChecked = true;
          }
        }
      });
      this.setState({resourceLegends: activeDonutLegends});

      const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.resourceDonutData.donut_details)));
      if (isEdgeCase) {
        this.initializeDonuts(getDonutDataFormat('resource_type', this.props.resourceDonutDetails));
        this.initializeLegends(getDonutLegendsFormat('resource_type', this.props.resourceDonutDetails));
      }
    }
  }

  // Method to update donut on legend double click
  updateDonutOnDoubleClick(selectedSector) {
    if (Object.keys(selectedSector)[0] === 'severity') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.severityDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          availableSector.isVisible = true;
        } else {
          availableSector.isVisible = false;
        }
      });
      this.setState({severityDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.severityLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          selectedLegend.isChecked = true;
        } else {
          selectedLegend.isChecked = false;
        }
      });
      this.setState({severityLegends: activeDonutLegends});

    } else if (Object.keys(selectedSector)[0] === 'anomaly') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.anomalyDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          availableSector.isVisible = true;
        } else {
          availableSector.isVisible = false;
        }
      });
      this.setState({anomalyDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.anomalyLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          selectedLegend.isChecked = true;
        } else {
          selectedLegend.isChecked = false;
        }
      });
      this.setState({anomalyLegends: activeDonutLegends});

    } else if (Object.keys(selectedSector)[0] === 'resource_type') {

      let activeDonutData = JSON.parse(JSON.stringify(this.state.resourceDonutData));
      activeDonutData.donut_details.forEach((availableSector)=> {
        if (availableSector.key_name === selectedSector[Object.keys(selectedSector)[0]]) {
          availableSector.isVisible = true;
        } else {
          availableSector.isVisible = false;
        }
      });
      this.setState({resourceDonutData: activeDonutData});

      let activeDonutLegends = JSON.parse(JSON.stringify(this.state.resourceLegends));
      activeDonutLegends.forEach((selectedLegend)=> {
        if (selectedSector[Object.keys(selectedSector)[0]] === selectedLegend.key_name){
          selectedLegend.isChecked = true;
        } else {
          selectedLegend.isChecked = false;
        }
      });
      this.setState({resourceLegends: activeDonutLegends});

    }
  }

  getSeverityDonutChartView() {
    const horizontalAlign = {
      width: '33.33%',
      margin: '0 auto',
      padding: '20px 50px'
    }
    return(
      <div className="donut-wrapper" style={horizontalAlign}>
        <D3DonutChart
          data={this.state.severityDonutData}
          legendsData={this.state.severityLegends}
          key="severity"
          title="Severity"
          onSingleClickCallback={(value)=> this.handleSingleClick(value)}
          onDoubleClickCallback={(value)=> this.handleDoubleClick(value)} />
      </div>
    );
  };

  getAnomalyDonutChartView() {
    const horizontalAlign = {
      width: '33.33%',
      margin: '0 auto',
      padding: '20px 50px'
    }
    return(
      <div className="donut-wrapper" style={horizontalAlign}>
        <D3DonutChart
          data={this.state.anomalyDonutData}
          legendsData={this.state.anomalyLegends}
          key="anomaly"
          title="anomaly"
          onSingleClickCallback={(value)=> this.handleSingleClick(value)}
          onDoubleClickCallback={(value)=> this.handleDoubleClick(value)} />
      </div>
    );
  };

  getResourceDonutChartView() {
    const horizontalAlign = {
      width: '33.33%',
      margin: '0 auto',
      padding: '20px 50px'
    }
    return(
      <div className="donut-wrapper" style={horizontalAlign}>
        <D3DonutChart
          data={this.state.resourceDonutData}
          legendsData={this.state.resourceLegends}
          key="resource_type"
          title="resource_type"
          onSingleClickCallback={(value)=> this.handleSingleClick(value)}
          onDoubleClickCallback={(value)=> this.handleDoubleClick(value)} />
      </div>
    );
  }

  getVisualizationEmptyState() {
    const emptyStateWrapper = {
      width: '33.33%',
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
    if (data && data.donut_details.length > 0){
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  render() {
    return (
      <div className="donut-tab-view-wrapper">
        { this.isDataAvailable(this.state.severityDonutData) ? this.getSeverityDonutChartView() : this.getVisualizationEmptyState() }
        { this.isDataAvailable(this.state.anomalyDonutData) ? this.getAnomalyDonutChartView() : this.getVisualizationEmptyState() }
        { this.isDataAvailable(this.state.resourceDonutData) ? this.getResourceDonutChartView() : this.getVisualizationEmptyState() }
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    days: state.get('alertPanelHistoryBound'),
    searchQuery: state.get('globalSearchQuery'),
    refreshInterval: state.get('refreshInterval'),
    severityDonutDetails: state.get('severityDonutDetails'),
    anomalyDonutDetails: state.get('anomalyDonutDetails'),
    resourceDonutDetails: state.get('resourceDonutDetails'),
  };
}


export default connect(
  mapStateToProps
)(DonutTabView);