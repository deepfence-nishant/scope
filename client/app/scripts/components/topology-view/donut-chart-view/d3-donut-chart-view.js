/*eslint-disable*/
// React imports
import React from 'react';

// Custom component imports
import D3Chart from './d3-chart';
import DataSeries from './data-series';
import D3Legend from '../../common/clickable-legends-view/d3-legend';

class D3DonutChart extends React.Component {

  render() {
    const donutWrapperSpacing = {
      display: 'flex',
      marginTop: '10px',
      marginBottom: '10px'
    };
    const donutContainer = {
      borderBottom: '1px solid #252525'
    };
    const legendStyles = {
      display: 'block'
    }
    return (
      <div style={donutContainer}>
        { this.props.data.donut_details.length > 0 &&
        <div>
          <div className="donut-chart-title">{this.props.title}</div>
          <div style={donutWrapperSpacing}>
            <div style={{width: '160px', textAlign: 'center'}}>
              <D3Chart width={this.props.width} height={this.props.height}>
                <DataSeries
                  data={this.props.data}
                  width={this.props.width}
                  height={this.props.height}
                  nodeName={this.props.nodeName}
                  topologyType={this.props.topologyType} />
              </D3Chart>
            </div>
            <div style={{width: '200px', textAlign: 'left'}}>
              <D3Legend
                data={this.props.legendsData}
                legendStyle={legendStyles}
                donutName={this.props.data.donut_name}
                onSingleClickCallback={this.props.onSingleClickCallback}
                onDoubleClickCallback={this.props.onDoubleClickCallback} />
            </div>
          </div>
        </div>
        }
      </div>
    );
  }
}
export default D3DonutChart;

D3DonutChart.defaultProps = {
  width: 100,
  height: 100,
  title: '',
  Legend: true
};
