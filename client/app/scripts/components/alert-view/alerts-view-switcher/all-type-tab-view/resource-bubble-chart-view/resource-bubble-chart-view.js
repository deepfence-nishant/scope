/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

import BubbleChart from '../../../../common/bubble-chart/bubble-chart';
import D3Legend from '../../../../common/clickable-legends-view/d3-legend';

import { isEqual } from 'lodash';
import {
  getResourceBubbleChartData, receiveNotifyAlertsResponse,
  setSearchQuery
} from '../../../../../actions/app-actions';
import { EMPTY_STATE_TEXT } from '../../../../../constants/naming';
import { getOrderedData, luceneQueryChecker, updateSearchQueryArr } from '../../../../../utils/array-utils';
import {
  legendEdgeCaseCheck, maintainVisualizationData,
  modifyVisualizationData
} from '../../../../../utils/visualization-utils';
import {
  BUBBLE_CHART_UPPER_BOUND_LIMIT_MESSAGE,
  RESOURCE_BUBBLE_CHART_UPPER_BOUND_LIMIT
} from "../../../../../constants/visualization-config";
import {TIME_BOUNDARY_OPTIONS} from "../../../../../constants/dashboard-refresh-config";

function getFormattedLegendsData(data) {
  const result = [];
  const uniqueSeverity = getUniqueResourceType(data);
  uniqueSeverity.forEach((uniqueRecord)=> {
    result.push({key_name: uniqueRecord.resource_type, key_value: 0, isChecked: true});
  });

  return result;
}

function getUniqueResourceType(data) {
  const result = [];
  data.forEach((record)=> {
    if (result.indexOf(record.resource_type) === -1) {
      result.push(record.resource_type);
    }
  });

  const resultArrWithSeverityCount = [];
  getOrderedData('resource_type', result).forEach((uniqueKey)=> {
    let counter = 0;
    for (let i=0; i<data.length; i++){
      if (uniqueKey == data[i].resource_type){
        counter += data[i].count;
      }
    }
    resultArrWithSeverityCount.push({resource_type: uniqueKey, resourceTypeCount: counter})
  });


  return resultArrWithSeverityCount;
}

function getFilteredData(data) {
  const result = [];
  let dataCopy = JSON.parse(JSON.stringify(data));
  dataCopy.forEach((record)=> {
    if (record.isVisible){
      result.push(record);
    }
  });
  return result;
}

function getLuceneQueryOnBubbleClick(params) {
  let luceneQuery = '';
  luceneQuery += `(resource_type:${params.resource_type})`;

  return luceneQuery
}

class ResourceBubbleChartView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleSingleClick = this.handleSingleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  componentDidMount() {
    // Initial api call to get data
    this.retrieveBubbleChartData();

    // If props already updated load the data from props.
    if (this.props.bubbleChartData) {
      this.updateBubbleChart(modifyVisualizationData(this.props.bubbleChartData));
      this.initializeLegends(getFormattedLegendsData(this.props.bubbleChartData));
    }

    // Calls on the basis of active time interval
    if(this.props.refreshInterval){
      let interval = setInterval(()=>{
        this.retrieveBubbleChartData();
      }, this.props.refreshInterval.value*1000);
      this.setState({intervalObj : interval});
    }
  }

  componentWillReceiveProps(newProps){
    if(newProps.refreshInterval && (this.props.refreshInterval != newProps.refreshInterval)){
      let interval = setInterval(()=>{
        this.retrieveBubbleChartData();
      }, newProps.refreshInterval.value*1000)
      if(this.state.intervalObj){
        clearInterval(this.state.intervalObj);
      }
      this.setState({intervalObj : interval});
    }
    if (!isEqual(newProps.bubbleChartData, maintainVisualizationData(this.props.bubbleChartData))) {
      this.checkDataLength(newProps.bubbleChartData);
    } else if ((newProps.days != this.props.days) || (newProps.searchQuery != this.props.searchQuery)) {
      this.setState({ display: undefined, number: undefined, time_unit: undefined}, function stateUpdateComplete() {
        const activeDuration = newProps.days.value;
        this.retrieveBubbleChartData(activeDuration.number, activeDuration.time_unit, newProps.searchQuery);
      }.bind(this));
    }
  }

  componentWillUnmount() {
    // Clearing the intervals
    if(this.state.intervalObj){
      clearInterval(this.state.intervalObj);
    }
    // Resetting component states
    this.setState({
      bubble_chart_data: undefined,
      number: undefined,
      time_unit: undefined,
      display: undefined
    });
  }

  // Method to check data length before visualization update.
  checkDataLength(data) {
    if (data.length <= RESOURCE_BUBBLE_CHART_UPPER_BOUND_LIMIT) {
      this.updateBubbleChart(modifyVisualizationData(data));
      this.initializeLegends(getFormattedLegendsData(data));
    } else {
      this.props.dispatch(receiveNotifyAlertsResponse(BUBBLE_CHART_UPPER_BOUND_LIMIT_MESSAGE));
      this.setPreviousDuration();
    }
  }

  // Method to set previous available option from time boundary options.
  setPreviousDuration() {
    let activeDuration = this.state.display ? this.state.display : this.props.days.display;
    const index = TIME_BOUNDARY_OPTIONS.findIndex(option => option.display == activeDuration);
    const previousOptionIndex = index - 1;
    const previousOption = TIME_BOUNDARY_OPTIONS[previousOptionIndex];
    this.setState({
      display: previousOption.display,
      number: previousOption.value.number,
      time_unit: previousOption.value.time_unit
    }, function stateUpdateComplete() {
      this.retrieveBubbleChartData(this.state.number, this.state.time_unit, this.props.searchQuery);
    }.bind(this));
  }

  retrieveBubbleChartData(number, time_unit, lucene_query) {
    if (this.props.days || number) {
      let params = {
        number: number || this.state.number || this.props.days.value.number,
        time_unit: time_unit || this.state.time_unit || this.props.days.value.time_unit,
        lucene_query: lucene_query || this.props.searchQuery
      }
      this.props.dispatch(getResourceBubbleChartData(params));
    }
  }

  updateBubbleChart(data) {
    this.setState({bubble_chart_data: data});
    this.setState({dataToBePopulate: data});
  }

  initializeLegends(legendsData) {
    this.setState({bubbleChartLegends: legendsData});
  }

  handleSingleClick(value) {
    this.updateBubbleChartOnSingleClick(value);
  }

  handleDoubleClick(legend) {
    this.updateBubbleChartOnDoubleClick(legend);
  }

  updateBubbleChartOnSingleClick(selectedLegend) {
    let activeBubbleChartData = JSON.parse(JSON.stringify(this.state.bubble_chart_data));
    activeBubbleChartData.forEach((record)=> {
      if (record.resource_type === selectedLegend[Object.keys(selectedLegend)[0]]) {
        if (record.isVisible) {
          record.isVisible = false;
        } else {
          record.isVisible = true;
        }
      }
    });
    const filteredData = getFilteredData(activeBubbleChartData);
    this.setState({dataToBePopulate: filteredData});
    this.setState({bubble_chart_data: activeBubbleChartData});

    // Legend Update
    let activeLegends = JSON.parse(JSON.stringify(this.state.bubbleChartLegends));
    activeLegends.forEach((legend)=> {
      if (selectedLegend[Object.keys(selectedLegend)[0]] === legend.key_name){
        if (legend.isChecked) {
          legend.isChecked = false;
        } else {
          legend.isChecked = true;
        }
      }
    });
    this.setState({bubbleChartLegends: activeLegends});

    const isEdgeCase = legendEdgeCaseCheck(JSON.parse(JSON.stringify(this.state.bubble_chart_data)));
    if (isEdgeCase) {
      this.updateBubbleChart(modifyVisualizationData(this.state.bubble_chart_data));
      this.initializeLegends(getFormattedLegendsData(this.state.bubble_chart_data));
    }
  }

  updateBubbleChartOnDoubleClick(selectedLegend) {
    let bubbleChartData = JSON.parse(JSON.stringify(this.state.bubble_chart_data));

    // Visualization update
    bubbleChartData.forEach((record)=> {
      if (record.resource_type === selectedLegend[Object.keys(selectedLegend)[0]]) {
        record.isVisible = true;
      } else {
        record.isVisible = false;
      }
    });
    this.setState({bubble_chart_data: bubbleChartData});

    // Legend Update
    let activeLegends = JSON.parse(JSON.stringify(this.state.bubbleChartLegends));
    activeLegends.forEach((legend)=> {
      if (selectedLegend[Object.keys(selectedLegend)[0]] === legend.key_name){
        legend.isChecked = true;
      } else {
        legend.isChecked = false;
      }
    });
    this.setState({bubbleChartLegends: activeLegends});

    const filteredData = getFilteredData(bubbleChartData);
    this.setState({dataToBePopulate: filteredData});
  }

  handleBubbleMouseInEvent(bubbleData) {
    this.props.onBubbleMouseOverCallback(bubbleData);
  }

  handleBubbleMouseOutEvent() {
    this.props.onBubbleMouseOutCallback();
  };

  handleBubbleClickEvent(data) {
    let params = {
      resource_type: data.resource_type
    };
    const luceneQuery = getLuceneQueryOnBubbleClick(params);
    const isLuceneQueryExist = luceneQueryChecker(this.props.searchQuery, `(${luceneQuery})`);

    let searchQuery = [];
    if (this.props.searchQuery.length > 0) {
      if (!isLuceneQueryExist) {
        searchQuery = updateSearchQueryArr(this.props.searchQuery, `(${luceneQuery})`);
      } else {
        searchQuery = this.props.searchQuery;
      }
    } else {
      searchQuery.push(`${luceneQuery}`);
    }

    this.props.dispatch(setSearchQuery({searchQuery:searchQuery}));
  }

  getBubbleChartView() {
    const { dataToBePopulate } = this.state;
    return (
      <BubbleChart data={dataToBePopulate}
                   onBubbleMouseInCallback={(bubbleData)=> this.handleBubbleMouseInEvent(bubbleData)}
                   onBubbleMouseOutCallback={(bubbleData)=> this.handleBubbleMouseOutEvent(bubbleData)}
                   onBubbleClickCallback={(bubbleData)=> this.handleBubbleClickEvent(bubbleData)}
                   bubbleChartType='resource'
      />
    );
  }

  getBubbleChartLegendsView() {
    const { bubbleChartLegends } = this.state;
    const legendStyles = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-around'
    }
    return (
      <D3Legend
        data={bubbleChartLegends}
        donutName="severity"
        legendStyle={legendStyles}
        onSingleClickCallback={(value) => this.handleSingleClick(value)}
        onDoubleClickCallback={(value) => this.handleDoubleClick(value)} />
    );
  }

  getBubbleChartEmptyState() {
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

  render() {
    const { bubble_chart_data, bubbleChartLegends } = this.state;
    return (
      <div className="resource-bubble-chart-wrapper">
        <div className="chart-heading">Resources Bubble Chart</div>
        <div className='visualization-wrapper'>
          { (bubble_chart_data && bubble_chart_data.length > 0) ? this.getBubbleChartView() : this.getBubbleChartEmptyState() }
        </div>
        <div className='bubble-chart-legends-wrapper'>
          { bubbleChartLegends && this.getBubbleChartLegendsView() }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    bubbleChartData: state.get('bubbleChartData'),
    searchQuery: state.get('globalSearchQuery'),
    days: state.get('alertPanelHistoryBound'),
    refreshInterval: state.get('refreshInterval')
  };
}

export default connect(
  mapStateToProps
)(ResourceBubbleChartView);
