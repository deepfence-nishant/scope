/*eslint-disable*/

//React imports
import React from 'react';
import { connect } from 'react-redux';
import NVD3Chart from 'react-nvd3';

import { getAreaChartData } from '../../../utils/web-api-utils';
import { setSearchQuery } from '../../../actions/app-actions';
import {luceneQueryChecker, updateSearchQueryArr} from "../../../utils/array-utils";

const timeLabelArr = [ '30s', '1m', '2m', '10m', '30m', '1h'];
const dateTimeLabelArr = ['10h'];
const dateLabelArr = ['1d', '2d', '3d', '6d', '1M'];
const controlOptions = []

class Nvd3StackAreaChart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      chartData :[],
      isStackedAreaChartToggled: false
    };
  }

  componentWillReceiveProps(newProps) {
    if((newProps.days != this.props.days || newProps.searchQuery != this.props.searchQuery) && newProps.days.value ){
      var queryParams = {
        time_unit:newProps.days.value.time_unit,
        number:newProps.days.value.number,
        lucene_query: newProps.searchQuery || ''
      }
      getAreaChartData(this.props.dispatch ,queryParams);
    }
    if(newProps.areaChartData && newProps.days == this.props.days && newProps.searchQuery == this.props.searchQuery){
      let chartOptions = {
        critical: {
          key: "Critical",
          color: "rgba(219, 37, 71, 1)"
        },
        high: {
          key: "High",
          color: "rgba(255, 138, 0, 1)"
        },
        medium: {
          key: "Medium",
          color: "rgba(255, 200, 55, 1)"
        },
        low: {
          key: "Low",
          color: "rgba(0, 169, 255, 1)"
        }
      };
      let dataArr= [], apiChartData = newProps.areaChartData.data;

      //get all x axis values
      let xaxisValues=[];
      for(let dataIdx = 0; dataIdx < apiChartData.length; dataIdx++){
        let alertArr = apiChartData[dataIdx].alerts;
        for(let alertIdx = 0; alertIdx < alertArr.length; alertIdx++ ){
          if(xaxisValues.indexOf(alertArr[alertIdx].timestamp) == -1){
            xaxisValues.push(alertArr[alertIdx].timestamp);
          }
        }
      }
      xaxisValues.sort();

      //create data array for nvd3
      for(let dataIdx = 0; dataIdx < apiChartData.length; dataIdx++){
        dataArr.push(chartOptions[apiChartData[dataIdx].severity]);

        //inject missing x axis
        let alertArr = apiChartData[dataIdx].alerts, extendedAlertArr=[];
        if(alertArr.length != xaxisValues.length){
          for(let xIdx = 0, alertIdx=0; xIdx < xaxisValues.length; xIdx++ ){
            if( !alertArr[alertIdx] || (xaxisValues[xIdx] != alertArr[alertIdx].timestamp)){
              extendedAlertArr.push({timestamp: xaxisValues[xIdx], count: 0});
              alertIdx++;
            }
            else{
              extendedAlertArr.push(alertArr[alertIdx]);
            }
            alertIdx++;
          }
        }
        else{
          extendedAlertArr= alertArr;
        }
        dataArr[dataIdx].values = extendedAlertArr;
      }
      this.setState({chartData:dataArr, chartDataInterval:newProps.areaChartData.interval}, function stateUpdateComplete() {
        if (this.state.chartData.length > 1) {
          this.enableNvd3ChartTooltip();
        }
      }.bind(this))
    }
  }

  componentDidMount() {
    if (this.props.days != undefined){
      var queryParams = {
        time_unit:this.props.days.value.time_unit,
        number:this.props.days.value.number,
        lucene_query: this.props.searchQuery || ''
      }
      getAreaChartData(this.props.dispatch ,queryParams);
    }
  }

  componentDidUpdate() {
    this.clearNvd3ChartTooltip();
  }

  enableNvd3ChartTooltip() {
    const elements = document.getElementsByClassName("nv-area nv-area-0");
    if (elements.length) {
      elements[0].style.pointerEvents= 'visible';
    }
  }

  clearNvd3ChartTooltip() {
    const elements = document.getElementsByClassName("nvtooltip xy-tooltip");
    if (elements.length){
      for (let element=0; element<elements.length; element++){
        const ele = elements[element];
        // Solution-1:: Removing all the tooltip elements from DOM
        ele.parentNode.removeChild(ele);

        // Solution-2:: Applying display:none to all tooltip elements present in DOM.
        // ele.style.display = 'none';
      }
    }
  }

  getXaxisLabel(timestamp) {
    const dateObj = new Date(timestamp);

    if(timeLabelArr.indexOf(this.state.chartDataInterval) > -1){
      return dateObj.getHours() + ':' + (dateObj.getMinutes() <10 ? '0'+dateObj.getMinutes(): dateObj.getMinutes()) ;
    }
    else if(dateLabelArr.indexOf(this.state.chartDataInterval) > -1){
      // return dateObj.getDate() + '.' + (dateObj.getMonth()+1) + '.' + (dateObj.getFullYear()%100);
      return dateObj.getDate() + '-' + (dateObj.getMonth()+1) + '-' + (dateObj.getFullYear()%100);
    }
    else if(dateTimeLabelArr.indexOf(this.state.chartDataInterval) > -1){
      return dateObj.getDate() + '-' + (dateObj.getMonth()+1) + '-' + (dateObj.getFullYear()%100) + ' ' + dateObj.getHours() + ':' + (dateObj.getMinutes() <10 ? '0'+dateObj.getMinutes(): dateObj.getMinutes());

    }
    return "empty";
  }

  getXaxisLabelLimit(){
    let xAxisLimit;

    if(!this.state.chartData || !this.state.chartData.length){
      xAxisLimit = 0;
    }
    else{
      if(timeLabelArr.indexOf(this.state.chartDataInterval) > -1){
        xAxisLimit = 9;
      }
      else if(dateLabelArr.indexOf(this.state.chartDataInterval) > -1){
        xAxisLimit = 4;
      }
      else if(dateTimeLabelArr.indexOf(this.state.chartDataInterval) > -1){
        xAxisLimit = 6;
      }

      if(xAxisLimit > this.state.chartData[0].values.length){
        xAxisLimit = this.state.chartData[0].values.length;
      }
    }
    return xAxisLimit;
  }

  clickHandler(e) {

    let searchQuery = [];
    let currentQuery = `(severity:${e.series})`;

    const isLuceneQueryExist = luceneQueryChecker(this.props.searchQuery, currentQuery);
    if (this.props.searchQuery.length > 0) {
      if (!isLuceneQueryExist) {
        this.setState({isStackedAreaChartToggled: true});
        searchQuery = updateSearchQueryArr(this.props.searchQuery, currentQuery);

        // Disabling stack area chart click event
        const elements = document.getElementsByClassName("nv-area nv-area-0");
        elements[0].style.pointerEvents= 'none';

        this.props.dispatch(setSearchQuery({searchQuery:searchQuery}));
      } else {
        searchQuery = this.props.searchQuery;
      }
    } else {
      // Disabling stack area chart click event

      const elements = document.getElementsByClassName("nv-area nv-area-0");
      elements[0].style.pointerEvents= 'none';

      searchQuery.push(currentQuery);
      this.props.dispatch(setSearchQuery({searchQuery:searchQuery}));
    }

  }

  render() {
    let datas = {
      type: 'stackedAreaChart',
      datum: this.state.chartData,
      xAxis: {
        ticks: this.getXaxisLabelLimit(),
        tickFormat: this.getXaxisLabel.bind(this)
      },
      height: 200,
      yAxis: { tickColor: "#ff0000" },
      x: (d)=> d.timestamp,
      y: (d) => d.count?d.count:0,
      controlOptions:controlOptions,
      useInteractiveGuideline: true,
      configure: (chart)=> {
        chart.stacked.dispatch.on('areaClick', function (e) {
          this.clickHandler(e);
        }.bind(this));
        return chart
      }
    }

    return (
      <NVD3Chart id="stackedAreaChart" { ...datas } />
    );
  }
}

function mapStateToProps(state) {
  return {
    areaChartData: state.get('areaChartData'),
    days: state.get('alertPanelHistoryBound'),
    searchQuery: state.get('globalSearchQuery')
  };
}

export default connect(
  mapStateToProps
)(Nvd3StackAreaChart);
