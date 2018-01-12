/* eslint-disable */
import React from 'react';
import { connect } from 'react-redux';

import {
  setActiveFilters,
  updateTableJSONModalView,
  closeJsonTableViewModal
} from "../../../../actions/app-actions";

import { EMPTY_STATE_TEXT } from "../../../../constants/naming";

import { getTableCellStyles } from '../../../../utils/color-utils';

import CheckBox from "../../../common/checkbox/checkbox";
import {
  removeUnderscore, zeroAppender
} from "../../../../utils/string-utils";
import {getUserRole} from "../../../../helpers/auth-helper";

class DetailsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSeverityDropDownVisible: false,
      isAnomalyDropDownVisible: false,
      isMaskingInProcess: false,
      isManualNotifyingInProcess: false,
      isActionButtonVisible: false,
      selectedAlertsMapper: {}
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
    this.setFilterOptions(
      this.props.severityDonutDetails, this.props.anomalyDonutDetails,
      this.props.activeDonut, this.props.activeSector
    );
  }

  componentWillReceiveProps(newProps) {
    if (newProps.activeDonut != this.props.activeDonut || newProps.activeSector != this.props.activeSector){
      this.setFilterOptions(
        newProps.severityDonutDetails, newProps.anomalyDonutDetails,
        newProps.activeDonut, newProps.activeSector
      );
      this.resetComponentStateVariables();
    }
    if (this.props.isAlertMasked === true && newProps.isAlertMasked === false){
      this.updateMaskedAlertUI();
      this.resetComponentStateVariables();
    }
    // Reseting table action button ui on toster hide.
    if (this.props.isToasterVisible === true && newProps.isToasterVisible === false) {
      this.updateMaskedAlertUI();
      this.resetComponentStateVariables();
    }
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
  formatFilterOption(filterName, filterOptions, activeDonut, activeSector) {
    const resultArr = [];
    Object.keys(filterOptions).forEach((option)=> {
      if ((activeDonut === filterName) && (activeSector[0] === option)) {
        resultArr.push({name: option, value: option, isChecked: true});
      } else {
        resultArr.push({name: option, value: option, isChecked: false});
      }
    });
    return resultArr;
  }

  setFilterOptions(severityDonutDetails, anomalyDonutDetails, activeDonut, activeSector) {
    this.populateFilterValues(
      this.formatFilterOption('severity', severityDonutDetails, activeDonut, activeSector),
      this.formatFilterOption('anomaly', anomalyDonutDetails, activeDonut, activeSector)
    );
    this.props.dispatch(setActiveFilters(undefined, undefined));
  };

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
    activeFilter.severity = this.getActiveOptions(this.state.severityOption);
    activeFilter.anomaly = this.getActiveOptions(this.state.anomalyOption);

    let activeOptions = {};
    activeOptions.severity = this.getActiveOptions(this.state.severityOption);
    activeOptions.anomaly = this.getActiveOptions(this.state.anomalyOption);

    this.props.onFilterApplyCallback(activeFilter, activeOptions);
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
    let headers = ["@timestamp", "event_type", "severity", "summary", "action"];
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
    const userRole = getUserRole();
    switch(header){
      case '@timestamp': {
        return (
          <div>
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
               onMouseLeave={()=> this.toggleAnomalyDropDown()}>
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
      case 'severity': {
        return (
          <div style={{marginLeft: '20px', width: '100px'}} className="severity-dropdown-wrapper"
               onMouseEnter={()=> this.toggleSeverityDropDown()} onMouseLeave={()=> this.toggleSeverityDropDown()}>
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
      case 'summary': {
        return (
          <div style={{marginLeft: '20px', width: '400px'}}>Summary</div>
        );
      }
      case 'action': {
        return (
          <div className="delete-btn-wrapper">
            {
              this.state.isActionButtonVisible ?
                <div className="delete-button">
                  <i className="fa fa-bell-o" aria-hidden="true" style={{color: '#0276c9', fontSize: '20px', marginRight: '5px'}} onClick={()=> this.notifyAlerts()}></i>
                  {(userRole == 'admin') && <i className="fa fa-trash-o" aria-hidden="true" style={{color: '#db2547'}} onClick={()=> this.maskAlerts()}></i>}
                </div> : <div className="action-button" style={{marginLeft: '5px'}}>Action</div>
            }
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
        } else if (header === 'severity') {
          column =
            <div style={severityColumnWidth} className={" " + getTableCellStyles(row[header]) }>
              <span style={{textTransform: 'capitalize'}}>{row[header]}</span>
            </div>
        } else if (header === 'summary') {
          column =
            <div style={{marginLeft: '20px'}}>
              <span>{row[header]}</span>
            </div>
        } else if (header === 'event_type') {
          column =
            <div className={" " + getTableCellStyles(row[header])} style={typeColumnWidth}>
              <span style={{textTransform: 'capitalize'}}>{removeUnderscore(row[header])}</span>
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
    }

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
    activeDonut: state.get('activeDonut'),
    activeSector: state.get('activeSector'),
    severityDonutDetails: state.get('severityDonutDetails'),
    anomalyDonutDetails: state.get('anomalyDonutDetails'),
    isAlertMasked: state.get('isAlertMasked'),
    isToasterVisible: state.get('isToasterVisible'),
  };
}

export default connect(
  mapStateToProps
)(DetailsTable);