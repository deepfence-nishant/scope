/* eslint-disable */
import React from 'react';
import RowExpandView from './row-expand-view';

class KeyValuePairTable extends React.Component {
  constructor(props) {
    super(props);
  }

  getData() {
    return this.props.data['_source'];
  }

  isValueString(value) {
    let isString = false;
    if (typeof value == 'string'){
      isString = true;
    } else {
      isString = false;
    }
    return isString;
  }

  getStringValueView(stringValue) {
    const valueWidth = {
      width: '60%',
      textAlign: 'left',
      padding: '2px 10px'
    }
    return (
      <div style={valueWidth}>{ stringValue }</div>
    );
  };

  getNestedValueView(data) {
    return (
      <RowExpandView data={data}></RowExpandView>
    )
  };

  render() {
    const tableRow = {
      display: 'flex',
      borderTop: 'none',
      width: '100%',
      padding: '5px 0px'
    }
    const keyWidth = {
      width: '40%',
      textAlign: 'left',
      padding: '2px 10px'
    }

    const data = this.getData();
    let pairs = [];
    for(var key in data){
      pairs.push(
        <li style={tableRow} key={key}>
          <div style={keyWidth}>{key}</div>
          { this.isValueString(data[key]) ? this.getStringValueView(data[key]) : this.getNestedValueView(data[key]) }
        </li>
      );
    }

    return (
      <ul className="table-wrapper">
        {pairs}
      </ul>
    )
  }
}

export default KeyValuePairTable;
