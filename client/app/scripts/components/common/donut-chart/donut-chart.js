/*eslint-disable*/
// React imports
import React from 'react';

// Custom component imports
import D3Chart from './d3-chart';
import DataSeries from './data-series';
import D3Legend from '../../common/clickable-legends-view/d3-legend';
import {getLegendName} from "../../../utils/string-utils";

class D3DonutChart extends React.Component {

  render() {
    const donutWrapperSpacing = {
      marginTop: '10px',
      marginBottom: '10px'
    };
    const donutContainer = {
      width: '100%'
    };
    const legendStyles = {
      display: 'flex',
      justifyContent: 'space-around',
      padding: '20px 0px',
      fontSize: '12px'
    }
    return (
      <div style={donutContainer}>
        { this.props.data.donut_details.length > 0 &&
        <div style={{margin: '0 auto'}}>
          <div className="donut-chart-title" style={{textAlign: 'center', textTransform: 'uppercase'}}>
            {getLegendName(this.props.title)}
          </div>
          <div style={donutWrapperSpacing}>
            <div style={{textAlign: 'center'}}>
              <D3Chart width={this.props.width} height={this.props.height}>
                <DataSeries data={this.props.data} width={this.props.width} height={this.props.height} />
              </D3Chart>
            </div>
            <D3Legend
              data={this.props.legendsData}
              legendStyle={legendStyles}
              donutName={this.props.data.donut_name}
              onSingleClickCallback={this.props.onSingleClickCallback}
              onDoubleClickCallback={this.props.onDoubleClickCallback} />
          </div>
        </div>
        }
      </div>
    );
  }
}
export default D3DonutChart;

D3DonutChart.defaultProps = {
  width: 200,
  height: 200,
  title: '',
  Legend: true
};
