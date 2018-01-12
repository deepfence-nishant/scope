/*eslint-disable*/

// React imports
import React from 'react';
import { connect } from 'react-redux';

const durationOption = [
  {id: 1, number: '5', time_unit: 'minute'}, {id: 2, number: '15', time_unit: 'minute'},
  {id: 3, number: '30', time_unit: 'minute'}, {id: 4, number: '60', time_unit: 'minute'}
];

class DurationDropdownWrapper extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedDuration: durationOption[0].number
    };
    this.handleDropDownChange = this.handleDropDownChange.bind(this);
  }

  componentDidMount() {
    this.props.onDurationDropDownChangeCallback(this.state.selectedDuration);
  }

  handleDropDownChange(event) {
    const selectedDuration = event.target.value;
    this.setState({
      selectedDuration: selectedDuration
    });
    this.props.onDurationDropDownChangeCallback(selectedDuration);
  }

  render() {
    return (
      <div className='duration-wrapper'>
        <div className='wrapper-heading'>Choose Duration</div>
        <div className='dropdown-wrapper'>
          <select value={this.state.selectedDuration} onChange={this.handleDropDownChange} className="duration-select">
            {durationOption.map((option) => {
              return (<option key={option.id} value={option.number}>every {option.number} minute</option>);
            })}
          </select>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(
  mapStateToProps
)(DurationDropdownWrapper);
