/*eslint-disable*/

// React imports
import React from 'react';
import {connect} from 'react-redux';

import { isEqual } from 'lodash';

import D3DonutChart from './d3-donut-chart-view';
import { getDonutDetails } from '../../../utils/web-api-utils';
import { legendEdgeCaseCheck } from '../../../utils/visualization-utils';

function getOrderedData(donutType, data) {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const anomalyOrder = ['network_anomaly', 'behavioral_anomaly', 'system_audit', 'syscall_anomaly'];
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
  }
  return result;
}

function getDonutLegendsFormat(donutType, metaData) {
  const donutMetaData = getOrderedData(donutType, metaData);
  let donutDataFormat = {};
  const donutData = [];
  donutDataFormat['donut_name'] = donutType;
  for(const key in donutMetaData) {
    donutData.push({key_name: key, key_value: donutMetaData[key], isChecked: true});
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

class DonutView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.handleSingleClick = this.handleSingleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);

    this.initializeLegends = this.initializeLegends.bind(this);
    this.initializeDonuts = this.initializeDonuts.bind(this);

    this.updateDonutOnSingleClick = this.updateDonutOnSingleClick.bind(this);
    this.updateDonutOnDoubleClick = this.updateDonutOnDoubleClick.bind(this);
  }

  componentDidMount() {
    // Initial api call to get the data
    if (this.props.activeTopology && (this.props.activeTopology == 'containers' || this.props.activeTopology == 'hosts')){
      this.callDonutApi();
    }

    // If data is present then update the view
    if (this.props.severityDonutDetails && this.props.anomalyDonutDetails) {
      let params = {
        severityData: this.props.severityDonutDetails,
        anomalyData: this.props.anomalyDonutDetails
      };
      if (this.props.activeTopology == 'containers' || this.props.activeTopology == 'hosts'){
        this.updateDonutView(params);
      }
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
    } else if ((newProps.days != this.props.days) || (newProps.activeContainer != this.props.activeContainer) ||
      (newProps.activeTopology != this.props.activeTopology)) {
      if (newProps.activeTopology == 'containers' || newProps.activeTopology == 'hosts') {
        this.callDonutApi(
          newProps.activeContainer, newProps.activeTopology, newProps.days.value.number, newProps.days.value.time_unit
        );
      }
    } else if (!isEqual(newProps.severityDonutDetails, this.props.severityDonutDetails) ||
      !isEqual(newProps.anomalyDonutDetails, this.props.anomalyDonutDetails)){
      let params = {
        severityData: newProps.severityDonutDetails,
        anomalyData: newProps.anomalyDonutDetails,
      }
      if (newProps.activeTopology == 'containers' || newProps.activeTopology == 'hosts'){
        this.updateDonutView(params);
      }
    }
  }

  componentWillUnmount() {
    this.setState({
      severityDonutData: undefined,
      severityLegends: undefined,
      anomalyDonutData: undefined,
      anomalyLegends: undefined
    });
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  callDonutApi(activeContainer, activeTopology, number, timeUnit) {
    let params = {
      active_container: activeContainer || this.props.activeContainer,
      active_topology: activeTopology || this.props.activeTopology,
      number: number || this.props.days.value.number,
      time_unit: timeUnit || this.props.days.value.time_unit,
    }
    getDonutDetails(this.props.dispatch, 'severity', params);
    getDonutDetails(this.props.dispatch, 'anomaly', params);
  }

  updateDonutView(params) {
    // Severity donut
    this.initializeLegends(getDonutLegendsFormat('severity', params.severityData));
    this.initializeDonuts(getDonutDataFormat('severity', params.severityData));

    // Anomaly donut
    this.initializeLegends(getDonutLegendsFormat('anomaly', params.anomalyData));
    this.initializeDonuts(getDonutDataFormat('anomaly', params.anomalyData));
  }

  initializeLegends(donutLegendsDetails) {
    if (donutLegendsDetails.donut_name === 'severity') {
      this.setState({severityLegends: donutLegendsDetails.donut_details});
    } else if (donutLegendsDetails.donut_name === 'anomaly') {
      this.setState({anomalyLegends: donutLegendsDetails.donut_details});
    }
  }

  initializeDonuts(donutData) {
    if (donutData.donut_name === 'severity') {
      this.setState({severityDonutData: donutData});
    } else if (donutData.donut_name === 'anomaly') {
      this.setState({anomalyDonutData: donutData});
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

    }
  }

  render() {
    return (
      <div>
        {this.state.severityDonutData && <div className="donut-wrapper">
          <D3DonutChart
            data={this.state.severityDonutData}
            legendsData={this.state.severityLegends}
            key="severity"
            title="Severity"
            nodeName={this.props.nodeName}
            topologyType={this.props.topologyType}
            onSingleClickCallback={(value)=> this.handleSingleClick(value)}
            onDoubleClickCallback={(value)=> this.handleDoubleClick(value)} />
        </div>
        }
        {this.state.anomalyDonutData && <div className="donut-wrapper">
          <D3DonutChart
            data={this.state.anomalyDonutData}
            legendsData={this.state.anomalyLegends}
            key="anomaly"
            title="anomaly"
            nodeName={this.props.nodeName}
            topologyType={this.props.topologyType}
            onSingleClickCallback={(value)=> this.handleSingleClick(value)}
            onDoubleClickCallback={(value)=> this.handleDoubleClick(value)} />
        </div>
        }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    severityDonutDetails: state.get('severityDonutDetails'),
    anomalyDonutDetails: state.get('anomalyDonutDetails'),

    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval'),

    activeContainer: state.get('nodeDetails').last().label,
    activeTopology: state.get('currentTopologyId')
  };
}

export default connect(
  mapStateToProps
)(DonutView);
