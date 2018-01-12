/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

// Custom component imports
import SeverityRadioButtonsView from '../../common/severity-radio-button-collection/severity-radio-button-collection';
import DurationDropdownWrapper from '../../common/duration-dropdown/duration-dropdown';
import IntegrationTableView from '../integration-table-view/integration-table-view';

import {resetIntegrationStates, submitIntegrationRequest} from '../../../actions/app-actions';
import { getIntegrations } from '../../../utils/web-api-utils';

class HipChatIntegrationView extends React.Component {
  constructor() {
    super();
    this.state = {
      room: '',
      roomToken: '',
      severity: '',
      duration: '',
      isSuccess: false,
      isError: false,
      submitted: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRadioButtonState = this.handleRadioButtonState.bind(this);
    this.handleDurationDropDownState = this.handleDurationDropDownState.bind(this);
  }

  componentDidMount() {
    this.resetStates();
    this.fetchIntegrationList();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.isSuccess && !newProps.isError) {
      this.setState({
        integrationAddResponse: newProps.integrationAddResponse,
        isSuccess: newProps.isSuccess,
        isError: newProps.isError
      });
    } else if (!newProps.isSuccess && newProps.isError) {
      this.setState({
        integrationAddResponse: newProps.integrationAddResponse,
        isSuccess: newProps.isSuccess,
        isError: newProps.isError
      });
    }
    if (newProps.availableHipChatIntegrations) {
      this.setState({
        availableHipChatIntegrations: newProps.availableHipChatIntegrations
      })
    }
  }

  componentWillUnmount() {
    this.setState({
      isSuccess: false,
      isError: false
    });
  }

  resetStates() {
    this.props.dispatch(resetIntegrationStates());
  }

  fetchIntegrationList() {
    getIntegrations(this.props.dispatch);
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleRadioButtonState(selectedSeverity) {
    this.setState({
      severity: selectedSeverity
    });
  }

  handleDurationDropDownState(selectedDuration) {
    this.setState({
      duration: selectedDuration
    })
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ submitted: true });
    const { room, roomToken, severity, duration } = this.state;
    if (room && roomToken) {
      let params = {
        room: room,
        room_token: roomToken,
        alert_level: severity,
        duration: duration,
        integration_type: 'hipchat'
      }
      this.props.dispatch(submitIntegrationRequest(params));
    }
  }

  getEmailIntegrationFormView() {
    const { room, roomToken, submitted } = this.state;
    return (
      <div className="form-wrapper">
        <form name="form" onSubmit={this.handleSubmit}>
          <div className={'form-group' + (submitted && !room ? ' has-error' : '')}>
            <label htmlFor="room">
              <i className="fa fa-comments-o" aria-hidden="true"></i>
              <input type="text" className="form-control" name="room" placeholder="Chat room" value={room} onChange={this.handleChange} />
            </label>
            { submitted && !room && <div className="field-error">Chat room name is required</div> }
          </div>
          <div className={'form-group' + (submitted && !roomToken ? ' has-error' : '')}>
            <label htmlFor="roomToken">
              <i className="fa fa-key" aria-hidden="true"></i>
              <input type="text" className="form-control" name="roomToken" placeholder="Room token" value={roomToken} onChange={this.handleChange} />
            </label>
            { submitted && !roomToken && <div className="field-error">Room token is required</div> }
          </div>

          <div className='radio-btn-duration-dropdown-wrapper'>
            <div className='severity-container'>
              <SeverityRadioButtonsView onRadioButtonCheckedCallback={(value) => this.handleRadioButtonState(value)} />
            </div>
            <div className='duration-container'>
              <DurationDropdownWrapper onDurationDropDownChangeCallback={(value) => this.handleDurationDropDownState(value)} />
            </div>
          </div>
          <div className="error-msg-container">
            {this.state.isError && <div className="auth-error-msg">{this.state.integrationAddResponse}</div>}
            {this.state.isSuccess && <div className="auth-success-msg">{this.state.integrationAddResponse}</div>}
          </div>
          <div className="form-group">
            <button className="app-btn">Subscribe for Alerts</button>
          </div>
        </form>
      </div>
    );
  }

  getIntegrationTableView() {
    return (
      <IntegrationTableView recordCollection={this.state.availableHipChatIntegrations} />
    );
  }

  getTableEmptyState() {
    return (
      <div className='empty-state-wrapper'>
        No Integrations Found
      </div>
    )
  }

  render() {
    return (
      <div className='hip-chat-integration-view-wrapper'>
        <div className='col-md-5 col-lg-5 integration-form-section'>
          { this.getEmailIntegrationFormView() }
        </div>
        <div className='col-md-7 col-lg-7 integration-list-section'>
          { this.state.availableHipChatIntegrations && this.state.availableHipChatIntegrations.length > 0 ?
            this.getIntegrationTableView() : this.getTableEmptyState() }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isSideNavCollapsed: state.get('isSideNavCollapsed'),
    isSuccess: state.get('isSuccess'),
    isError: state.get('isError'),
    integrationAddResponse: state.get('integrationAddResponse'),
    availableHipChatIntegrations: state.get('availableHipChatIntegrations')
  };
}

export default connect(
  mapStateToProps
)(HipChatIntegrationView);
