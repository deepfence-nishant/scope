/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// API call methods
import {getAlertStats} from '../../../utils/web-api-utils';
import { fetchRunningContainerCount, fetchRunningHostCount } from '../../../actions/app-actions';

function getResponsiveFontSize(params, defaultSize) {
  let maxNumberDigit;
  if (typeof params === 'object') {
    const maxNumber= Math.max(params.critical, params.high, params.medium, params.low);
    maxNumberDigit = maxNumber.toString().length;
  } else {
    maxNumberDigit = params.toString().length;
  }

  const defaultFontSize= defaultSize;
  const limit = 5;

  let fontSize;
  if (maxNumberDigit <= limit){
    fontSize = `${defaultFontSize}px`;
  } else {
    const extraDigit = maxNumberDigit - limit;
    fontSize = `${(defaultFontSize- (extraDigit*2))}px`;
  }

  return fontSize;
}

class AlertStatsView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.callAlertStatsApi();
    this.callScopeApis();

    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.callAlertStatsApi();
        this.callScopeApis();
      }, this.props.refreshInterval.value*1000)
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.days != this.props.days) {
      const queryParams = {
        lucene_query: newProps.searchQuery,
        number: newProps.days.value.number,
        time_unit: newProps.days.value.time_unit,
        _type: 'alert'
      };
      getAlertStats(this.props.dispatch, queryParams);
    }
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.callAlertStatsApi();
        this.callScopeApis();
      }, newProps.refreshInterval.value*1000)
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }
    else if((newProps.searchQuery && (this.props.searchQuery != newProps.searchQuery)) || (this.props.days.display != newProps.days.display)){
      this.callAlertStatsApi(
        newProps.searchQuery,
        newProps.days.value.number,
        newProps.days.value.time_unit,
        newProps.hosts.hostCount
      );
    }
  }

  callAlertStatsApi(searchQuery, number, time_unit){
    if (this.props.days) {
      const queryParams = {
        lucene_query: searchQuery || this.props.searchQuery,
        number: number || this.props.days.value.number,
        time_unit: time_unit || this.props.days.value.time_unit,
        _type: 'alert'
      };
      getAlertStats(this.props.dispatch, queryParams);
    }
  }

  callScopeApis(){
    // API CALL TO GET CONTAINER COUNT FROM SCOPE.
    this.props.dispatch(fetchRunningContainerCount());
    // API CALL TO GET HOST COUNT FROM SCOPE.
    this.props.dispatch(fetchRunningHostCount());
  }

  componentWillUnmount(){
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
  }

  render() {
    const {
      alerts = 0,
      containers = 0,
      hosts = 0,
      criticalAlerts = 0,
      highAlerts = 0,
      mediumAlerts = 0,
      lowAlerts = 0,
    } = this.props;

    let params={
      critical: criticalAlerts,
      high: highAlerts,
      medium: mediumAlerts,
      low: lowAlerts
    }
    const alertsCountFontSize = getResponsiveFontSize(params, 20);
    const totalAlertsCountFontSize = getResponsiveFontSize(params, 36);

    return (
      <div className="alert-stats-wrapper">
        <div className="total-alerts-wrapper">
          <div className="icon-wrapper">
            <div className="icon-total-alerts"></div>
          </div>
          <div className="data-wrapper">
            <div className="total-alerts-count" style={{fontSize: totalAlertsCountFontSize}}>{alerts}</div>
            <div className="total-alerts-text">total alerts</div>
          </div>
        </div>
        <div className="alerts-wrapper">
          <div className="alert-details critical-alert">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{criticalAlerts}</div>
              <div className="name">critical</div>
            </div>
          </div>
          <div className="alert-details high-alert">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{highAlerts}</div>
              <div className="name">High</div>
            </div>
          </div>
          <div className="alert-details medium-alert">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{mediumAlerts}</div>
              <div className="name">medium</div>
            </div>
          </div>
          <div className="line-break" />
          <div className="alert-details low-alert">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{lowAlerts}</div>
              <div className="name">low</div>
            </div>
          </div>
          <div className="alert-details">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{hosts.hostsCount}</div>
              <div className="name">hosts</div>
            </div>
          </div>
          <div className="alert-details">
            <div className="alerts-details-container">
              <div className="count" style={{fontSize: alertsCountFontSize}}>{containers.containerCount}</div>
              <div className="name">containers</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    alerts: state.get('alerts'),
    containers: state.get('containers'),
    hosts: state.get('hosts'),
    criticalAlerts: state.get('critical_alerts'),
    highAlerts: state.get('high_alerts'),
    mediumAlerts: state.get('medium_alerts'),
    lowAlerts: state.get('low_alerts'),
    searchQuery: state.get('globalSearchQuery'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(AlertStatsView);
