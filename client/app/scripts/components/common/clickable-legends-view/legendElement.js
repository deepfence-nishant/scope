/*eslint-disable*/

// React imports
import React from 'react';

// Color util imports
import { getSectorBackgroundColor, getSectorStrokeColor } from '../../../utils/color-utils';

// String util imports
import {getLegendName, removeUnderscore} from '../../../utils/string-utils';

let timer = 0;
let delay = 200;
let prevent = false;

class LegendElement extends React.Component{

  constructor(props) {
    super(props);
    this.state = {};

    this.handleClick = this.handleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
  }

  doClickAction() {
    let params = {};
    params[this.props.donutName] = this.props.keyName;
    this.props.onSingleClickCallback(params);
  }

  doDoubleClickAction() {
    let params = {};
    params[this.props.donutName] = this.props.keyName;
    this.props.onDoubleClickCallback(params);
  }

  /*START :: CLICK HANDLERS*/
  handleClick() {
    let me = this;
    timer = setTimeout(function() {
      if (!prevent) {
        me.doClickAction();
      }
      prevent = false;
    }, delay);
  }
  handleDoubleClick(){
    clearTimeout(timer);
    prevent = true;
    this.doDoubleClickAction();
  }
  /*END :: CLICK HANDLERS*/

  render() {
    const legendColor = getSectorBackgroundColor(this.props.keyName);
    const legendBorderColor = getSectorStrokeColor(this.props.keyName);

    const legendWrapper = {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer'
    }
    const activeLegendStyles = {
      width: '12px',
      height: '12px',
      marginRight: '5px',
      borderRadius: '50%',
      backgroundColor: legendColor,
      border: `1px solid ${legendBorderColor}`
    }
    const inActiveLegendStyles = {
      width: '12px',
      height: '12px',
      marginRight: '5px',
      borderRadius: '50%',
      backgroundColor: 'transparent',
      border: `1px solid ${legendBorderColor}`
    }
    const legendText = {
      color: '#999999',
      textTransform: 'capitalize',
      width: '70%'
    }
    const legendCount = {
      color: '#999999',
    }
    return (
      <div
        style={legendWrapper}
        onClick={() => this.handleClick()}
        onDoubleClick={() => this.handleDoubleClick()}>
        <div style={this.props.isChecked ? activeLegendStyles : inActiveLegendStyles} />
        <div style={legendText}>{getLegendName(this.props.keyName)}</div>
        {this.props.keyValue!=0 && <div style={legendCount}>{this.props.keyValue}</div>}
      </div>
    );
  }

}
export default LegendElement;