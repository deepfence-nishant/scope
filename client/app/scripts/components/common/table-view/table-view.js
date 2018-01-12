/* eslint-disable */
import React from 'react';
import { connect } from 'react-redux';

import CheckBox from "../checkbox/checkbox";

import {
  updateTableJSONModalView,
  closeJsonTableViewModal
} from "../../../actions/app-actions";

import { EMPTY_STATE_TEXT } from "../../../constants/naming";
import {
  removeUnderscore, zeroAppender
} from "../../../utils/string-utils";
import { getUserRole } from "../../../helpers/auth-helper";
import { getTableCellStyles } from "../../../utils/color-utils";
import {getSeverityByType, getSummaryByType} from "../../../utils/table-utils";

const severityDropDownOption = [
  {name: "critical", value: "critical", isChecked: false},
  {name: "high", value: "high", isChecked: false},
  {name: "low", value: "low", isChecked: false},
  {name: "medium", value: "medium", isChecked: false}
];

const anomalyDropDownOption = [
  {name: "behavioral_anomaly", value: "behavioral_anomaly", isChecked: false},
  {name: "network_anomaly", value: "network_anomaly", isChecked: false},
  {name: "system_audit", value: "system_audit", isChecked: false},
  {name: "syscall_anomaly", value: "syscall_anomaly", isChecked: false}
];

class TableView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSeverityDropDownVisible: false,
      isAnomalyDropDownVisible: false,
      isMaskingInProcess: false,
      isManualNotifyingInProcess: false,
      isActionButtonVisible: false,
      selectedAlertsMapper: {},
    }

    this.viewDetails = this.viewDetails.bind(this);
    this.sortDate = this.sortDate.bind(this);
    this.toggleSeverityDropDown = this.toggleSeverityDropDown.bind(this);
    this.handleCheckboxState = this.handleCheckboxState.bind(this);
    this.updateMaskedAlertUI = this.updateMaskedAlertUI.bind(this);
    this.maskAlerts = this.maskAlerts.bind(this);
    this.notifyAlerts = this.notifyAlerts.bind(this);
    this.toggleActionButton = this.toggleActionButton.bind(this);
    this.resetComponentStateVariables = this.resetComponentStateVariables.bind(this);
  }

  componentDidMount() {
    this.resetFilters();
    this.populateFilterValues(severityDropDownOption, anomalyDropDownOption);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.isAlertMasked === true && newProps.isAlertMasked === false) {
      this.updateMaskedAlertUI();
      this.resetComponentStateVariables();
    }
    // Resetting table filters on change in search query
    if (newProps.searchQuery != this.props.searchQuery) {
      this.resetFilters();
    }
    // Reseting table action button ui on toster hide.
    if (this.props.isToasterVisible === true && newProps.isToasterVisible === false) {
      this.updateMaskedAlertUI();
      this.resetComponentStateVariables();
    }
  }

  resetFilters() {
    this.initializeDropDownValues(severityDropDownOption);
    this.initializeDropDownValues(anomalyDropDownOption);
    this.setState({severityOption: severityDropDownOption, anomalyOption: anomalyDropDownOption},
      function stateUpdateComplete() {
    }.bind(this));
  }

  initializeDropDownValues(dropDownOption) {
    dropDownOption.forEach((option)=>{
      option.isChecked = false;
    });
  }

  getData() {
    return this.props.data;
  }

  resetComponentStateVariables() {
    this.setState({
      selectedAlertsMapper: {}
    });
  }

  updateMaskedAlertUI() {
    this.setState({
      isMaskingInProcess: false,
      isManualNotifyingInProcess: false,
      isActionButtonVisible: false
    })
  }

  /* START :: METHODS TO POPULATE FILTERS */
  populateFilterValues(severityOption, anomalyOption) {
    this.setState({severityOption: severityOption});
    this.setState({anomalyOption: anomalyOption});
  }
  /* END :: METHODS TO POPULATE FILTERS */

  /* START :: FILTER DROPDOWN HANDLERS */
  handleCheckboxState(obj) {
    const dropdownType = Object.keys(obj);
    if (dropdownType[0] === 'anomaly') {
      this.state.anomalyOption.forEach((option) => {
        if (obj[dropdownType[0]] === option['value']){
          if (option.isChecked){
            option.isChecked = false;
          } else {
            option.isChecked = true;
          }
        }
      });
    } else if (dropdownType[0] === 'severity') {
      this.state.severityOption.forEach((option) => {
        if (obj[dropdownType[0]] === option['value']){
          if (option.isChecked) {
            option.isChecked = false;
          } else {
            option.isChecked = true;
          }
        }
      });
    }

    let activeFilter = {};
    if (this.props.type == 'alert') {
      activeFilter.severity = this.getActiveOptions(this.state.severityOption);
      activeFilter.anomaly = this.getActiveOptions(this.state.anomalyOption);
    } else if(this.props.type == 'cve') {
      activeFilter.cve_severity = this.getActiveOptions(this.state.severityOption);
    }

    this.props.onFilterApplyCallback(activeFilter);
  }

  getActiveOptions(optionCollection) {
    let resultArr = [];
    if (optionCollection && optionCollection.length > 0){
      optionCollection.forEach((option) => {
        if (option.isChecked){
          resultArr.push(option.value);
        }
      })
    }
    return resultArr;
  }
  /* END :: FILTER DROPDOWN HANDLERS */

  viewDetails(data) {
    this.props.dispatch(updateTableJSONModalView(data));
  }

  formatDate(dateObj) {
    let time = `${zeroAppender(new Date(dateObj).getHours())}:
                ${zeroAppender(new Date(dateObj).getMinutes())}:
                ${zeroAppender(new Date(dateObj).getSeconds())}.
                ${zeroAppender(new Date(dateObj).getMilliseconds())}`
    return `${time}`;
  }

  sortDate() {
    this.props.onSortCallback();
  }

  getTableHeaders() {
    let headers = this.props.tableHeader;
    return headers;
  }

  toggleSeverityDropDown() {
    const isDropdownVisible = this.state.isSeverityDropDownVisible;
    if (isDropdownVisible){
      this.setState({isSeverityDropDownVisible: false});
    } else {
      this.setState({isSeverityDropDownVisible: true});
    }
  }

  toggleAnomalyDropDown() {
    const isDropdownVisible = this.state.isAnomalyDropDownVisible;
    if (isDropdownVisible){
      this.setState({isAnomalyDropDownVisible: false});
    } else {
      this.setState({isAnomalyDropDownVisible: true});
    }
  }

  getStandardHeader(header){
    const typeColumnWidth = {
      width: '150px'
    }
    const severityColumnWidth = {
      width: '120px',
      marginLeft: '20px'
    }
    const userRole = getUserRole();
    switch(header){
      case '@timestamp': {
        return (
          <div style={{paddingLeft: '20px'}}>
            <span style={{marginRight: '5px'}}>Time (UTC)</span>
            { this.props.sortOrder === 'asc' &&
            <i className="fa fa-caret-down" aria-hidden="true" onClick={()=>this.sortDate()}></i>}
            { this.props.sortOrder === 'desc' &&
            <i className="fa fa-caret-up" aria-hidden="true" onClick={()=>this.sortDate()}></i>}
          </div>
        )
      }
      case 'event_type': {
        return (
          <div className="severity-dropdown-wrapper" onMouseEnter={()=> this.toggleAnomalyDropDown()}
               onMouseLeave={()=> this.toggleAnomalyDropDown()} style={typeColumnWidth}>
            <div>
              <span style={{marginRight: '5px'}}>Type</span>
              <span className="fa fa-caret-down" aria-hidden="true"></span>
            </div>
            { this.state.isAnomalyDropDownVisible &&
            <div className="dropdown-container">
              {this.state.anomalyOption.map(function (option) {
                return (
                  <CheckBox onCheckboxCheckedCallback={(obj) => this.handleCheckboxState(obj)}
                            dropDpwnType="anomaly" checkboxDetails={option} key={option.value} />
                );
              }.bind(this))}
            </div>
            }
          </div>
        )
      }
      case getSeverityByType(this.props.type): {
        return (
          <div style={severityColumnWidth}
               className="severity-dropdown-wrapper" onMouseEnter={()=> this.toggleSeverityDropDown()}
               onMouseLeave={()=> this.toggleSeverityDropDown()}>
            <div>
              <span style={{marginRight: '5px'}}>Severity</span>
              <span className="fa fa-caret-down" aria-hidden="true"></span>
            </div>
            { this.state.isSeverityDropDownVisible &&
            <div className="dropdown-container">
              {this.state.severityOption.map(function (option) {
                return (
                  <CheckBox onCheckboxCheckedCallback={(obj) => this.handleCheckboxState(obj)}
                            checkboxDetails={option} dropDpwnType="severity" key={option.value} />
                );
              }.bind(this))}
            </div>
            }
          </div>
        )
      }
      case getSummaryByType(this.props.type): {
        return (
          <div style={{marginLeft: '20px', width: '420px'}}>Summary</div>
        );
      }
      case 'cve_container_image': {
        return (
          <div style={{width: '100%'}}>container image</div>
        );
      }
      case 'cve_id': {
        return (
          <div style={{width: '100%'}}>CV Id</div>
        );
      }
      case 'action': {
        return (
          <div className="delete-btn-wrapper">
            {this.state.isActionButtonVisible ?
              <div className="delete-button">
                <i className="fa fa-bell-o" aria-hidden="true" style={{color: '#0276c9', marginRight: '10px'}} onClick={()=> this.notifyAlerts()}></i>
                {(userRole == 'admin') && <i className="fa fa-trash-o" aria-hidden="true" style={{color: '#db2547'}} onClick={()=> this.maskAlerts()}></i>}
              </div>
            : <div className="action-button">Action</div>}
          </div>
        );
      }
      default:{
        return header
      }
    }
  }

  maskAlerts() {
    this.setState({ isMaskingInProcess: true });
    const selectedAlerts = [];
    const alertsCollection = this.getData();
    alertsCollection.forEach((activeAlert)=> {
      if (this.state.selectedAlertsMapper.hasOwnProperty(activeAlert['_id'])) {
        selectedAlerts.push({
          '_id': activeAlert['_id'],
          '_index': activeAlert['_index'],
          '_type': activeAlert['_type']
        });
      }
    });
    this.props.onMaskAlertallback(selectedAlerts);
  }

  notifyAlerts() {
    this.setState({ isManualNotifyingInProcess: true });
    const selectedAlerts = [];
    const alertsCollection = this.getData();
    alertsCollection.forEach((activeAlert)=> {
      if (this.state.selectedAlertsMapper.hasOwnProperty(activeAlert['_id'])) {
        selectedAlerts.push({
          '_id': activeAlert['_id'],
          '_index': activeAlert['_index'],
          '_type': activeAlert['_type']
        });
      }
    });
    this.props.onNotifyAlertCallback(selectedAlerts);
  }

  toggleCheckboxChange(selectedAlert) {
    this.props.dispatch(closeJsonTableViewModal());
    const mapper = this.state.selectedAlertsMapper;
    if (mapper.hasOwnProperty(selectedAlert)){
      delete mapper[selectedAlert];
    } else {
      mapper[selectedAlert] = true;
    }
    this.setState({selectedAlertsMapper: mapper});
    this.toggleActionButton();
  }

  toggleActionButton() {
    if (Object.keys(this.state.selectedAlertsMapper).length != 0) {
      this.setState({isActionButtonVisible: true});
    } else {
      this.setState({isActionButtonVisible: false});
    }
  }

  highlightTableRow(activeRowId) {
    if (this.state.selectedAlertsMapper.hasOwnProperty(activeRowId)){
      return true;
    }
  }

  getTableHeaderView() {
    const headers = this.getTableHeaders();
    let tableHeaders = [];
    for (let i = 0; i < headers.length; i++) {
      tableHeaders.push(
        <div className="table-cell" style={{textTransform: 'capitalize'}} key={i}>
          { this.getStandardHeader(headers[i]) }
        </div>
      );
    }
    return tableHeaders;
  }

  getTableBodyView() {
    const donutDetails = this.getData();
    const headers = this.getTableHeaders();
    const timeStampTableCell = {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '20px'
    }
    const typeColumnWidth = {
      width: '150px'
    }
    const severityColumnWidth = {
      width: '120px',
      marginLeft: '20px'
    }

    let tableData = [];
    for (let j = 0; j < donutDetails.length; j++) {
      let columns = [];
      let row = donutDetails[j]['_source'];

      for(let index=0; index < headers.length; index++) {
        let header = headers[index];
        let column = row[header];
        if (header === '@timestamp') {
          column =
            <div style={timeStampTableCell}>
              <span>{this.formatDate(row[header])}</span>
            </div>
        } else if (header === getSeverityByType(this.props.type)) {
          column =
            <div style={severityColumnWidth} className={" " + getTableCellStyles(row[header])}>
              <span style={{textTransform: 'capitalize'}}>{row[header]}</span>
            </div>
        } else if (header === getSummaryByType(this.props.type)) {
          column =
            <div style={{marginLeft: '20px'}}>
              <span>{row[getSummaryByType(this.props.type)]}</span>
            </div>
        } else if (header === 'event_type') {
          column =
            <div className={" " + getTableCellStyles(row[header])} style={typeColumnWidth}>
              {/*<span style={{textTransform: 'capitalize'}}>{removeUnderscore(row[header])}</span>*/}
              <span style={{textTransform: 'capitalize'}}>{row[header]}</span>
            </div>
        } else if (header === 'action') {
          column =
            <input
              type="checkbox"
              value={donutDetails[j]['_id']}
              checked={this.state.selectedAlertsMapper.hasOwnProperty([donutDetails[j]['_id']])}
              onChange={() => this.toggleCheckboxChange(donutDetails[j]['_id'])}
            />
        }

        if (header === 'action'){
          columns.push(
            <div className="table-cell" style={{textAlign: 'right', paddingRight: '40px'}} key={index}>{column}</div>
          );
        } else if (header === 'summary'){
          columns.push(
            <div className="table-cell truncate" key={index} style={{width: '440px'}}>{column}</div>
          );
        } else {
          columns.push(
            <div className="table-cell truncate" key={index}>{column}</div>
          );
        }

      }
      tableData.push(
        <div className={`table-row ${(this.state.isMaskingInProcess && this.highlightTableRow(donutDetails[j]['_id'])) ? 'red' : (this.state.isManualNotifyingInProcess && this.highlightTableRow(donutDetails[j]['_id'])) ? 'blue' : ''}`}
             key={j} onClick={ ()=> {this.viewDetails(donutDetails[j])} }>{columns}
        </div>
      )
    }
    return tableData;
  }

  getTableEmptyState() {
    const emptyStateWrapper = {
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
    return(
      <div style={emptyStateWrapper}>
        <div className='empty-state-text'>{ EMPTY_STATE_TEXT }</div>
      </div>
    );
  }

  render() {
    const tableData = this.getData();
    const tableVerticalScroll = {
      overflowY: 'auto'
    };
    return (
      <div className="node-details-table-wrapper" style={tableVerticalScroll}>
        <div className='node-details-table'>
          <div className="table-header">
            { this.getTableHeaderView() }
          </div>
          <div className="table-body">
            { (tableData.length > 0) ? this.getTableBodyView() : this.getTableEmptyState() }
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return{
    isAlertMasked: state.get('isAlertMasked'),
    isToasterVisible: state.get('isToasterVisible'),
    searchQuery: state.get('globalSearchQuery')
  };
}

export default connect(
  mapStateToProps
)(TableView);