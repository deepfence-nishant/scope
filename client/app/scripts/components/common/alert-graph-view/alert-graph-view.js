/*eslint-disable*/
// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
// import StackAreaChart from './stack-area';
import Nvd3StackAreaChart from './nvd3-stack-area-chart';

class AlertGraphView extends React.Component {

  // Old Chart
  /*render() {
    return (
      <div className="alert-graph-wrapper">
        <div className="line-chart-wrapper" height={150}>
          <StackAreaChart />
        </div>
      </div>
    );
  }*/

  //New chart
  render() {
    return (
      <div className="alert-graph-wrapper">
        <div className="line-chart-wrapper" style={{height: '98%'}}>
          <Nvd3StackAreaChart />
        </div>
      </div>
    );
  }
}

export default AlertGraphView;