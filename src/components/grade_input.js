import React from 'react';
/**
 *The box where the user input the senester grade and the number of credit for each course
 *This is used to calculate the semester GPA 
 */
function GradeInputBox(props) {
  const options = props.optionValues.map((value, i) => <option key={i}>{value}</option>)
  return (
    <div className={`entry ${props.error ? "error" : ""}`}>
      <div className="row">
        <button onClick={() => props.onEntryRemoval()} type="button" className="delete-button">x</button>
      </div>
      <div className="row">
        <select className="grade-selection" onChange={(event) => props.onGradeSelection(event.target.value)}>
          {options}
        </select>
      </div>
      <div className="row">
        <input onKeyUp={(event) => props.onCreditInput(event.key)} type="text" className="single-char" name="credit" maxLength="1" />
      </div>
    </div>

  )
}

export default GradeInputBox;