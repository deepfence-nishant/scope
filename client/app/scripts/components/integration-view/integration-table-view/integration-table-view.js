/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';
import {requestIntegrationDelete} from "../../../actions/app-actions";

// Custom component imports

class IntegrationTableView extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  getTableHeaderView() {
    const { recordCollection } = this.props;
    const record = recordCollection[0];
    return (
      <tr>
        { record.email && <th>Email</th> }
        { record.channel && <th>Channel</th> }
        { record.webhook_url && <th>Webhook url</th> }
        { record.service_key && <th>Service key</th> }
        { record.room && <th>Chat room</th> }
        { record.room_token && <th>Token</th> }
        <th>Alert level</th>
        <th>Duration</th>
        <th>Action</th>
      </tr>
    )
  }

  getTableView() {
    const {recordCollection} = this.props;
    const deleteBtnStyles = {
      color: '#db2547',
      cursor: 'pointer'
    };
    const workBreakStyles = {
      wordBreak: 'break-all'
    }
    return (
      recordCollection.map((record) => {
        return (
          <tr key={record.id}>
            { record.email && <td style={workBreakStyles}>{ record.email }</td> }
            { record.channel && <td style={workBreakStyles}>{ record.channel }</td> }
            { record.webhook_url && <td style={workBreakStyles}>{ record.webhook_url }</td> }
            { record.service_key && <td style={workBreakStyles}>{ record.service_key }</td> }
            { record.room && <td style={workBreakStyles}>{ record.room }</td> }
            { record.room_token && <td style={workBreakStyles}>{ record.room_token }</td> }
            <td>{ record.alert_level }</td>
            <td style={workBreakStyles}>Every {record.duration_in_mins} minutes</td>
            <td className='text-center'>
              <i className="fa fa-trash-o" style={deleteBtnStyles} aria-hidden="true" onClick={()=> this.deleteIntegration(record)}></i>
            </td>
          </tr>
        )}
      )
    );
  };

  deleteIntegration(record) {
    let params = {
      id: record.id,
      integration_type: record.integration_type
    }
    this.props.dispatch(requestIntegrationDelete(params))
  }

  render() {
    return (
      <div className='email-integration-collection-wrapper'>
        <table className="table table-bordered table-striped">
          <thead>
          { this.getTableHeaderView() }
          </thead>
          <tbody>
          { this.getTableView() }
          </tbody>
        </table>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {

  };
}

export default connect(
  mapStateToProps
)(IntegrationTableView);
