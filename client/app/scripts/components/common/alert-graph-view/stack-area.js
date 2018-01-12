/*eslint-disable*/
// React imports
import React from 'react';
import { connect } from 'react-redux';

import { getAreaChartData } from '../../../utils/web-api-utils';

const chartOptions = {
  legend: {
    display: false
  },
  maintainAspectRatio: false,
  scales: {
    xAxes: [
      {
        gridLines: {
          display: false,
          color: "#252525"
        },
        scaleLabel: {
          display: true,
          labelString: 'Day'
        }
      }
    ],
    yAxes: [
      {
        stacked: true,
        gridLines: {
          color: "#252525"
        },
        scaleLabel: {
          display: true,
          labelString: '# of Alerts'
        }
      }
    ]
  },
  animation: {
    duration: 300
  },
  options: {
    plugins: {
        filler: {
            propagate: true
        }
    }
  }
}

class StackAreaChart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillReceiveProps(newProps){
    if((newProps.days != this.props.days || newProps.searchQuery != this.props.searchQuery) && newProps.days.value ){
      var queryParams = {
        time_unit:newProps.days.value.time_unit,
        number:newProps.days.value.number,
        lucene_query: newProps.searchQuery || ''
      }
      getAreaChartData(this.props.dispatch ,queryParams);
    }
    if(newProps.areaChartData && newProps.days == this.props.days && newProps.searchQuery == this.props.searchQuery){
    let labelArr = []
    let skipIdx=this.props.days.value.number < 30? 1: parseInt(this.props.days.value.number/30);
    for(let dayIdx=1; dayIdx<=this.props.days.value.number; dayIdx++){
      if(dayIdx % skipIdx == 0){
        labelArr.push(String(dayIdx));
      }
      else{
        labelArr.push('');
      }
    }

    let chartDataObj={
      critical: {
        label: 'Critical',
        lineTension: 0,
        fill:'-1',
        backgroundColor: 'rgba(219, 37, 71, 0.35)',
        borderColor: 'rgba(219, 37, 71, 1)',
        pointRadius: 0,
        borderWidth:2,
        pointHitRadius:5,
        data: []
      },
      high : {
        label: 'High',
        lineTension: 0,
        fill:'-1',
        backgroundColor: 'rgba(255, 138, 0, 0.35)',
        borderColor: 'rgba(255, 138, 0, 1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius:5,        
        data: []
      },
      medium : {
        label: 'Medium',
        lineTension: 0,
        fill:'-1',
        backgroundColor: 'rgba(255, 200, 55, 0.35)',
        borderColor: 'rgba(255, 200, 55, 1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius:5,        
        data: []
      },
      low : {
        label: 'Low',
        lineTension: 0,
        fill:'-1',
        backgroundColor: 'rgba(0, 169, 255, 0.35)',
        borderColor: 'rgba(0, 169, 255, 1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius:5,        
        data: []
      }
    }
    //generate dataset arr
    const nowTimestamp = new Date();
    const todayTimestamp = Date.UTC(nowTimestamp.getFullYear(),nowTimestamp.getMonth(), nowTimestamp.getDate(),0,0,0);
    const milliSecondsInDay = 24*60*60*1000;

    let dayIdx = this.props.days.value.number - 1,
        timestampIdx = todayTimestamp - (dayIdx*milliSecondsInDay),
        datasetArr =[];
    for(let severIdx = 0; severIdx<newProps.areaChartData.length; severIdx++){
      let severityLevel = newProps.areaChartData[severIdx].severity;
      let alertArr = newProps.areaChartData[severIdx].alerts;
      let timestampIdx = todayTimestamp - (dayIdx * milliSecondsInDay);
      datasetArr.push(chartDataObj[severityLevel]);

      for(let alertIdx = 0; timestampIdx <= todayTimestamp ,alertIdx<alertArr.length;){
          if(timestampIdx > alertArr[alertIdx].timestamp){
            alertIdx++;
          }
          else if(timestampIdx == alertArr[alertIdx].timestamp){
            datasetArr[severIdx].data.push(alertArr[alertIdx].count);
            timestampIdx+=milliSecondsInDay;
            alertIdx++;
          }
          else{
            datasetArr[severIdx].data.push(0);
            timestampIdx+=milliSecondsInDay;
          }
      }
    }

    datasetArr[0].fill="origin";

    let ctx = this.refs.chart.getContext('2d');
    if(this.state.chartObj){
      this.state.chartObj.destroy();
    }
    let chartJSObj = new Chart(ctx, {
          type: 'line',
          data: {
                labels: labelArr,
                datasets: datasetArr
              },
          options: chartOptions
      });
      this.setState({chartObj:chartJSObj});
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

  render(){
    return (
      <div className="line-chart-container">
        <canvas ref="chart" height={130}></canvas>
      </div>
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
)(StackAreaChart);
