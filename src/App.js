import React, { Component } from 'react';
import GradesInput from './components/grades_processor'
import Graph from './components/graph'
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="content">
        <h3>GPA Facilities</h3>
        <hr />
        <GradesInput />
        <hr />
        <hr />
        <hr />
        <h1>Graphing of the GPA over different semesters</h1>
        <Graph />
      </div>

    );
  }
}

export default App;
