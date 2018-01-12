/* eslint-disable */
// React imports
import React from 'react';
import PropTypes from 'prop-types';

import { isEqual } from 'lodash';

var d3 = require('d3');

// Custom component imports
import Sector from './sector';

class DataSeries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: this.getTotalValue(props.data)
    }
  }

  componentWillReceiveProps(newProps) {
    if ((!isEqual(newProps.data, this.props.data))) {
      const total = this.getTotalValue(newProps.data);
      this.setState({text: total});
    }
  }

  getTotalValue(data) {
    const result = data.donut_details.map(item => item.key_value);
    return result.reduce(function(memo, num){ return memo + num; }, 0);
  }

  setActiveSectorValue(value) {
    this.setState({text: value});
  }

  setDonutTotalValue(){
    this.setState({text: this.getTotalValue(this.props.data)});
  }

  getActiveSectorValues(data) {
    const result = [];
    for (let sector=0; sector<data.length; sector++) {
      const item = data[sector];
      if (item.isVisible) {
        result.push(item.key_value);
      }
    }
    return result;
  }

  getActiveSectorNames(data) {
    const result = [];
    for (let sector=0; sector<data.length; sector++) {
      const item = data[sector];
      if (item.isVisible) {
        result.push(item.key_name);
      }
    }
    return result;
  }

  render() {
    const containerName = this.props.nodeName;
    const topologyType = this.props.topologyType;
    const donutData = this.props.data.donut_details;
    const donutName = this.props.data.donut_name;
    const width = this.props.width;
    const height = this.props.height;
    const pie = d3.layout.pie();
    
    const result = this.getActiveSectorValues(donutData);
    const names = this.getActiveSectorNames(donutData);

    const sum = result.reduce(function(memo, num){ return memo + num; }, 0);
    const position = `translate(${(width) / 2},${(height) / 2})`;
    var percentCenter = "translate(0,3)";

    const bars = (pie(result)).map((point, i) => {
      return (
        <Sector data={point} ikey={i} key={i} name={names[i]} donutName={donutName}
                total={sum} width={width} height={height} nodeName={containerName}
                topologyType={topologyType} onSetValueCallback={(value) => this.setActiveSectorValue(value)}
                onUnsetValueCallback={() => this.setDonutTotalValue()}/>
      );
    });
    return (
      <g transform={position} style={{cursor: 'pointer'}}>
        {bars}
        <text
          fill="#999999"
          fontSize="15px"
          transform={percentCenter}
          textAnchor="middle">
          {this.state.text}
        </text>
      </g>
    );
  }
}
export default DataSeries;

DataSeries.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  data: PropTypes.object.isRequired,
};
