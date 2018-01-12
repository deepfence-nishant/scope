/*eslint-disable*/

import React from 'react';

// Library imports for JSON formatter
import Highlight from 'react-highlight';
// Highlighter theme
require('highlight.js/styles/atelier-forest-dark.css');

class JSONView extends React.Component {
  render() {
    return (
      <Highlight className="json">
        {JSON.stringify(this.props.data, null, 2) }
      </Highlight>
    );
  }
}

export default JSONView;
