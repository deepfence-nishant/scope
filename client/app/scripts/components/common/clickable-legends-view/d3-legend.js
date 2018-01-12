/*eslint-disable*/

// React imports
import React from 'react';
import PropTypes from 'prop-types';

// Custom component imports
import LegendElement from './legendElement';

class D3Legend extends React.Component{
  constructor() {
    super();
  }

  render() {
    const data = this.props.data;
    const elements = data.map((item, i)=>{
      return (
        <LegendElement
          keyName={item.key_name}
          keyValue={item.key_value}
          isChecked={item.isChecked}
          donutName={this.props.donutName}
          key={i} ikey={i}
          onSingleClickCallback={this.props.onSingleClickCallback}
          onDoubleClickCallback={this.props.onDoubleClickCallback}
        ></LegendElement>
      )
    });
    return(
      <div className="legend" height={this.props.height} style={this.props.legendStyle}>
        {elements}
      </div>
    );
  }
}
export default D3Legend;