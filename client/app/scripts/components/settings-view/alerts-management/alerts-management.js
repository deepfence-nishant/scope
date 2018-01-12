/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import { resetUserProfileStates, submitAlertsDeleteRequest } from '../../../actions/app-actions';

const severityCollection = [
  {name: 'Critical', value: 'critical'}, {name: 'High', value: 'high'},
  {name: 'Medium', value: 'medium'}, {name: 'Low', value: 'low'}
];

const durationOption = [
  {id: 1, display: 'last 1 day', number: '1', time_unit: 'day'},
  {id: 2, display: 'last 7 day', number: '7', time_unit: 'day'},
  {id: 3, display: 'last 30 day', number: '30', time_unit: 'day'},
  {id: 4, display: 'last 60 day', number: '60', time_unit: 'day'},
  {id: 5, display: 'last 90 day', number: '90', time_unit: 'day'},
  {id: 6, display: 'last 180 day', number: '180', time_unit: 'day'},
  {id: 7, display: 'delete all', number: '0', time_unit: 'all'}
];

class AlertsManagementView extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedDuration: durationOption[0].number
    };
    this.handleRadioButtonChange = this.handleRadioButtonChange.bind(this);
    this.handleDropDownChange = this.handleDropDownChange.bind(this);
  }

  componentDidMount() {
    this.resetStates();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.isSuccess && !newProps.isError) {
      this.setState({
        alertsDeleteResponse: newProps.alertsDeleteResponse,
        isSuccess: newProps.isSuccess,
        isError: newProps.isError
      });
    } else if (!newProps.isSuccess && newProps.isError) {
      this.setState({
        alertsDeleteResponse: newProps.alertsDeleteResponse,
        isSuccess: newProps.isSuccess,
        isError: newProps.isError
      });
    }
  }

  componentWillUnmount() {
    this.setState({
      selectedSeverity: undefined,
      selectedDuration: undefined,
      alertsDeleteResponse: undefined,
      isSuccess: undefined,
      isError: undefined
    })
  }

  resetStates() {
    this.props.dispatch(resetUserProfileStates());
  }

  handleRadioButtonChange(event) {
    const selectedOption = event.target.value;
    this.setState({
      selectedSeverity: selectedOption
    });
  }

  handleDropDownChange(event) {
    this.setState({
      selectedDuration: event.target.value
    });
  }

  handleSeverityDeletionSubmit() {
    let params = {
      number: this.state.selectedDuration,
      severity: this.state.selectedSeverity,
      time_unit: (this.state.selectedDuration != 0) ? 'day' : 'all'
    }
    this.props.dispatch(submitAlertsDeleteRequest(params));
  }

  getAlertManagementView() {
    const errorMsgContainer = {
      marginTop: '15px'
    };
    return (
      <div className="col-md-8 col-lg-8" style={{paddingLeft: '0px'}}>
        <div style={{border: '1px solid #252525', padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
          <div className="severity-option-wrapper"  onChange={this.handleRadioButtonChange}>
            <div className='wrapper-heading'>Choose Severity</div>
            {severityCollection.map((option)=> {
              return (
                <div key={option.value} className="severity-option">
                  <input type="radio" value={option.value} name='severity' />
                  <label htmlFor={option.name} className='radio-label'>
                    {option.name}
                  </label>
                </div>
              )
            })}
          </div>
          <div className='duration-wrapper'>
            <div className='wrapper-heading'>Choose Duration</div>
            <div className='dropdown-wrapper'>
              <select value={this.state.selectedDuration} onChange={this.handleDropDownChange} className="duration-select">
                {durationOption.map((option) => {
                  return (<option key={option.id} value={option.number}>{option.display}</option>);
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="error-msg-container" style={errorMsgContainer}>
          {this.state.isError && <div className="auth-error-msg">{this.state.alertsDeleteResponse}</div>}
          {this.state.isSuccess && <div className="auth-success-msg">{this.state.alertsDeleteResponse}</div>}
        </div>

        <div className='btn-wrapper'>
          <div className="u-m-btn" onClick={()=> this.handleSeverityDeletionSubmit()}>Delete</div>
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className='alerts-management-container'>
        <div className="tab-view-heading">delete alerts permanently</div>
        { this.getAlertManagementView() }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    alertsDeleteResponse: state.get('alertsDeleteResponse'),
    isError: state.get('isError'),
    isSuccess: state.get('isSuccess')
  };
}

export default connect(
  mapStateToProps
)(AlertsManagementView);
