/*eslint-disable*/

// React imports
import React from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

class SparkLineChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getGraphData() {
    // data is of shape [{date, value}, ...] and is sorted by date (ASC)
    let data = this.props.data;

    // Convert data into sparkline component format
    let result =[];
    for (let i=0; i<data.length; i++) {
      result.push(data[i].value);
    }
    return {result};
  }

  getEmptyGraphData() {
    return {
      result: [0, 0],
    };
  }

  render() {
    const hasData = this.props.data && this.props.data.length > 0;
    const graph = hasData ? this.getGraphData() : this.getEmptyGraphData();

    return (
      <div className="sparkline-chart-view">
        <Sparklines data={graph.result}>
          <SparklinesLine style={{ stroke: "#0276c9", fill: "#0b3e58", fillOpacity: "1" }}/>
        </Sparklines>
      </div>
    );
  }
}

export default SparkLineChart;
