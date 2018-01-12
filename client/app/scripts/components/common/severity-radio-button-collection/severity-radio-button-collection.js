/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

const severityCollection = [
  {name: 'Critical', value: 'critical'}, {name: 'High', value: 'high'},
  {name: 'Medium', value: 'medium'}, {name: 'Low', value: 'low'}
];

class SeverityRadioButtonsView extends React.Component {
  constructor() {
    super();
    this.state = {};
    this.handleRadioButtonChange = this.handleRadioButtonChange.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      selectedSeverity: undefined
    })
  }

  handleRadioButtonChange(event) {
    const selectedOption = event.target.value;
    this.setState({
      selectedSeverity: selectedOption
    });
    this.props.onRadioButtonCheckedCallback(selectedOption);
  }

  render() {
    return (
      <div className="severity-option-wrapper" onChange={this.handleRadioButtonChange}>
        <div className='wrapper-heading'>Choose Severity</div>
        {severityCollection.map((option)=> {
          return (
            <div key={option.value} className="severity-option">
              <input type="radio" value={option.value} name='severity' />
              <label htmlFor={option.name} className='radio-label'>{option.name}</label>
            </div>
          )
        })}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { };
}

export default connect(
  mapStateToProps
)(SeverityRadioButtonsView);
