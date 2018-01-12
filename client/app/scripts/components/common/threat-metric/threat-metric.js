/*eslint-disable*/

//React imports
import React from 'react';
import { connect } from 'react-redux';
import { getFirstWord, removeUnderscore } from '../../../utils/string-utils';
import { getLabelColour } from '../../../utils/color-utils';
import { getOrderedData } from '../../../utils/array-utils';

class ThreatMetric extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isDataAvailable:false
    };
    this.updateThreatMetric = this.updateThreatMetric.bind(this);
  }

  componentWillReceiveProps(newProps){
    if (newProps.hasOwnProperty('threatMetricDetails') && newProps.threatMetricDetails !== undefined){
      this.updateThreatMetric(newProps.threatMetricDetails);
    }
  }

  updateThreatMetric(response){
    this.setState({threatMetricDetails: response});
    setTimeout(()=> {
      this.setState({isDataAvailable: true});
    })
  }

  getMetricRow(recordCollection, activeRow, columns) {
    const columnCollection = getOrderedData('severity', columns);
    const rowDetails = [];
    rowDetails.push(
      <div className="metric-cell" key={activeRow}>{getFirstWord(removeUnderscore(activeRow))}</div>
    );
    for (let i=0; i<columnCollection.length; i++) {
      let activeColumn = columnCollection[i];
      for (let j=0; j<recordCollection.length; j++){
        let activeRecord = recordCollection[j];
        if (activeRecord.row === activeRow && activeRecord.column === activeColumn) {
          rowDetails.push(
            <div className={"metric-cell " + getLabelColour(activeColumn)} key={activeRecord.count}>
              {activeRecord.count}
            </div>
          )
        }
      }
    }
    return rowDetails;
  }

  populateThreatMetric(details) {
    const uniqueColumnsValues = getOrderedData('severity', this.getUniqueFields(details, 'column'));
    const uniqueColumns = [];
    uniqueColumns.push(<div className="column" key={0} />);
    for (let i=0; i<uniqueColumnsValues.length; i++){
      const key = uniqueColumnsValues[i];
      uniqueColumns.push(
        <div className="column header" key={key}>{uniqueColumnsValues[i]}</div>
      )
    }
    const uniqueRowValues = this.getUniqueFields(details, 'row');
    const uniqueRows = [];
    for (let j=0; j<uniqueRowValues.length; j++){
      const key = uniqueRowValues[j];
      uniqueRows.push(
        <div className="metric-row" key={key}>
          {this.getMetricRow(details, uniqueRowValues[j], uniqueColumnsValues)}
        </div>
      )
    }
    return (
      <div className="metric-wrapper">
        <div className="metric-columns-wrapper">
          {uniqueColumns}
        </div>
        <div className="metric-row-wrapper">
          {uniqueRows}
        </div>
      </div>
    )
  }

  getUniqueFields(details, field) {
    const result = [];
    for (let i=0; i<details.length; i++){
      if (result.indexOf(details[i][field]) === -1){
        result.push(details[i][field]);
      }
    }
    return result;
  }

  render() {
    return (
      <div id="threat-metric">
        { this.state.isDataAvailable && this.populateThreatMetric(this.state.threatMetricDetails) }
      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    threatMetricDetails: state.get('threatMetricDetails')
  };
}


export default connect(
  mapStateToProps
)(ThreatMetric);


ThreatMetric.defaultProps = {

};