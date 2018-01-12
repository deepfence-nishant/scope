/*eslint-disable*/
import React from 'react';

import JSONView from './json-view';
import KeyValuePairTable from './key-value-pair-table';

class Tabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTableViewVisible: true,
      isJSONViewVisible: false,
    }
    this.toggleTabView = this.toggleTabView.bind(this);
  }

  toggleTabView(e) {
    if (e.target.innerHTML === 'table') {
      this.setState({isTableViewVisible: true});
      this.setState({isJSONViewVisible: false});
    }
    else {
      this.setState({isTableViewVisible: false});
      this.setState({isJSONViewVisible: true});
    }
  }

  manipulateJSONResponse(responseData) {
    const response = responseData;
    return response._source;
  }

  manipulateTableResponse(responseData) {
    const response = responseData;
    delete response._source['@version'];
    return response;
  }

  render() {
    const tabsViewWrapper = {
      margin: 'auto 10px'
    }
    const tabCollection = {
      padding: '0px',
      textAlign: 'left',
      marginBottom: '0px'
    }

    let tabEle = null;
    if (this.state.isTableViewVisible) {
      tabEle = (
        <div id="tab1" className="tab-content">
          <KeyValuePairTable data={this.manipulateTableResponse(this.props.data)} />
        </div>
      );
    } else {
      tabEle = (
        <div id="tab2" className="tab-content json-background">
          <JSONView data={this.manipulateJSONResponse(this.props.data)} />
        </div>
      );
    }

    return (
      <div style={tabsViewWrapper}>
        <ul className="tabs-collection" style={tabCollection}>
          <li className={'tab ' + (this.state.isTableViewVisible ? 'active' : 'in-active')}>
            <span onClick={this.toggleTabView}>table</span>
          </li>
          <li className={'tab ' + (this.state.isJSONViewVisible ? 'active' : 'in-active')}>
            <span onClick={this.toggleTabView}>json</span>
          </li>
        </ul>
        <div className="tab-folder">
          {tabEle}
        </div>
      </div>
    );
  }
}

export default Tabs;
