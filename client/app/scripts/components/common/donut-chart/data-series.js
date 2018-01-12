/* eslint-disable */
// React imports
import React from 'react';
import PropTypes from 'prop-types';

import { isEqual } from 'lodash';

var d3 = require('d3');

// Custom component imports
import Sector from './sector';
import {getSectorStrokeColor} from "../../../utils/color-utils";
import {getLegendName, toUppercase} from "../../../utils/string-utils";

class DataSeries extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total: this.getTotalValue(props.data),
      text: 'Total'
    }
  }

  componentWillReceiveProps(newProps) {
    if ((!isEqual(newProps.data, this.props.data))) {
      const total = this.getTotalValue(newProps.data);
      this.setState({total: total});
    }
  }

  getTotalValue(data) {
    const result = data.donut_details.map(item => item.key_value);
    return result.reduce(function(memo, num){ return memo + num; }, 0);
  }

  setActiveSectorValue(value, text) {
    this.setState({total: value, text: text});
  }

  setDonutTotalValue(){
    this.setState({total: this.getTotalValue(this.props.data), text: 'Total'});
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
    const donutData = this.props.data.donut_details;
    const donutName = this.props.data.donut_name;
    const width = this.props.width;
    const height = this.props.height;
    const pie = d3.layout.pie();

    const result = this.getActiveSectorValues(donutData);
    const names = this.getActiveSectorNames(donutData);

    const sum = result.reduce(function(memo, num){ return memo + num; }, 0);
    const position = `translate(${(width) / 2},${(height) / 2})`;

    var countCenter = "translate(0,0)";
    var textCenter = "translate(0,25)";

    const bars = (pie(result)).map((point, i) => {
      return (
        <Sector data={point} ikey={i} key={i} name={names[i]}
                donutName={donutName} total={sum} width={width} height={height}
                onSetValueCallback={(value, text) => this.setActiveSectorValue(value, text)}
                onUnsetValueCallback={() => this.setDonutTotalValue()}/>
      );
    });
    return (
      <g transform={position} style={{cursor: 'pointer'}}>
        {bars}
        <text fill={getSectorStrokeColor(this.state.text)} fontSize="18px" fontWeight="bold" transform={countCenter} textAnchor="middle">
          {this.state.total}
        </text>
        <text fill="#999999" fontSize="12px" transform={textCenter} textAnchor="middle">
          {getLegendName(toUppercase(this.state.text))}
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
