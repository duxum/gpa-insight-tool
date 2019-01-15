import React from "react";
import InputGroup from "./grade_input";

let defaultLetterGradesValue =
{
  'Select Grade': undefined, //Message placeholder, it is not incolved in GPA calculation
  'A+': 4,
  'A': 4,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1,
  'D-': 0.67
}

let defaultGradeScalePattern = 'A+=>4, A=>4, A-=>3.67, B+=>3.33, B=>3, B-=>2.67, C+=>2.33, C=>2, C-=>1.67, D+=>1.33, D=>1, D-=>0.67'


class GradesProcessor extends React.Component {
  constructor(props) {
    super(props);
    this._entryKeyGen = 0
    this.scalePatternInputRef = React.createRef() //Reference to the input field for user provided grade scale pattern
    this.state = {
      entriesData: new Map([[this.nextKey(), {}], [this.nextKey(), {}], [this.nextKey(), {}], [this.nextKey(), {}]]), //Default entries available. Note thay the entries refers to the box of semester input
      letterToValue: defaultLetterGradesValue, //Maping of the grade letter to value
      gradeScalePattern: defaultGradeScalePattern, //Scale pattern in text. The patter mmust be a comma seprated list of Grade=>Value
      scalePatternInputError: false //Communicate the error in the provided grade scale pattern
    };
  }


  /**
   * key generator for grade input entries
   */
  nextKey() {
    return this._entryKeyGen++
  }


  /**
   * The pattern is encoded as comma separated sequence of letter-grade==>value
   * if there is an error in the pattern, calculating the GPA will be imposible and it will be 
   * @param {string} input - The pattern the iser typed dto represent the scale
   */
  updateGradeScale(input) {
    let newGradeMapping = {},
      newScalePattern = [] //Array of characters making the new scale pattern if the input is valid
    let scaleMatchingregex = /([A-Z](?:\+|-|\s*))=>([0-9]*\.?[0-9]+),*\s*/g
    let m, prevM //The respective matched content
    let lengthMatched = 0
    do {
      m = scaleMatchingregex.exec(input)
      if (m && m.length === 3) {
        newGradeMapping[m[1]] = m[2]
        newScalePattern.push(`${m[1]}=>${m[2]}`)
        lengthMatched += m[0].length
        prevM = m
      } else {
        if ((prevM && lengthMatched === input.length)) {
          this.setState({ scalePatternInputError: false, letterToValue: newGradeMapping, gradeScalePattern: newScalePattern.join(", ") })
          return
        }
      }
    } while (m)
    this.setState({ scalePatternInputError: true, letterToValue: {}, gradeScalePattern: "undefined" })
  }

  /**
   * Change the grade scale to the default one
   */
  defaultGradeScale() {
    this.scalePatternInputRef.current.value = ""
    this.setState({ letterGradesValue: defaultLetterGradesValue, gradeScalePattern: defaultGradeScalePattern, scalePatternInputError: false })
  }


  handleEntryAddition() {
    const data = new Map(this.state.entriesData)
    data.set(this.nextKey(), {})
    this.setState({ entriesData: data })
  }

  /**
   * update the state of the app by updating a given propery for entry with specific id
   * @param {string} propertyName - property whose name to be updated usually credit/grade
   * @param {int} id - id of the entry to update
   * @param {string|number} value - value to update property to
   */
  changePropertyWithID(propertyName, id, value) {
    const data = new Map(this.state.entriesData)
    let previousRecord = data.get(id) || {}
    previousRecord[propertyName] = value
    data.set(id, { ...previousRecord })
    this.setState({ entriesData: data })
  }


  /**
   * 
   * @param {int} id - The id of the entry which received the event of credit input
   * @param {number} credit - The numer of the credit for the entry
   */
  handleCreditInput(id, credit) {
    if (isNaN(credit)) {
      return
    }
    this.changePropertyWithID('credit', id, +credit)
  }

  /**
   * 
   * @param {number} id - The id of the entry which received the event of grade selection
   * @param {string} grade - The grade for the entry
   */
  handleGradeSelection(id, grade) {
    this.changePropertyWithID('grade', id, grade)
  }

  /**
   * Removes an entry with particular id
   * Note that we cannot have zero entry on UI. If id id 0, the function will have no effect
   * @param {number} id - The id of entry to remove
   */
  handleEntryRemoval(id) {
    if (this.state.entriesData.size === 1) {
      return
    }
    const data = new Map(this.state.entriesData)
    data.delete(id)
    this.setState({ entriesData: data })
  }

  /**
   * The used entries are the ones which contain credit value which are numbers 
   * or the user has interacted with those entries. Those entries the ones to be considered when calculating the GPA
   * @return {number|Array} - The ids of the entries whose format is expected
   */
  validEntries() {
    let entries = []
    for (let [id, value] of this.state.entriesData) {
      if (value && !isNaN(value.credit) && value.grade && value.grade !== 'Select Grade' && this.state.letterToValue[value.grade]) {
        entries.push(id)
      }
    }
    return entries
  }

  /**
   * returns the gpa calculated from credit number and grade of non-erroneous entries
   * Note that an entry correspond with a specific semester.
   */
  gpaValue() {
    let totalWeighted = 0, totalCreditTaken = 0;
    let validIDs = this.validEntries()
    for (let [id, value] of this.state.entriesData) {
      if (validIDs.includes(id)) {
        totalWeighted += value.credit * this.state.letterToValue[value.grade]
        totalCreditTaken += value.credit
      }
    }
    return (totalWeighted / totalCreditTaken)
  }

  render() {
    let entries = []
    let validIDs = this.validEntries()
    for (let id of this.state.entriesData.keys()) {
      entries.push(<InputGroup key={id} error={(validIDs.includes(id)) ? false : true}
        optionValues={Object.keys(defaultLetterGradesValue)}
        onGradeSelection={(grade) => this.handleGradeSelection(id, grade)}
        onCreditInput={(credit) => this.handleCreditInput(id, credit)}
        onEntryRemoval={() => this.handleEntryRemoval(id)} />)
    }
    let gpaValue = this.gpaValue()

    return (
      <div>
        <div className="message">
          <div>
            <input onChange={(event) => this.updateGradeScale(event.target.value)} type="text" ref={this.scalePatternInputRef} placeholder="input your grade scale pattern" className={`grade-scale-input ${this.state.scalePatternInputError ? 'error' : ''}`} /><button onClick={() => this.defaultGradeScale()}>default grade scale</button>
            <p>Note that the scale pattern is a comma separated list of letter-grade==>value i.e(A+==>3, ..., Z-==>6.4). The Default is {defaultGradeScalePattern} </p>
            <p>The current grade scale is {this.state.gradeScalePattern}</p>
          </div>
          <h3 style={{ textAlign: 'center' }}>The calculated GPA is <em style={{ color: 'green' }}>{gpaValue.toFixed(3)}</em>, without considering <em style={{ color: 'green' }}>{this.state.entriesData.size - validIDs.length}</em> uninteracted with/erronous entries.</h3>
          <h3><b>Select the grade and input the number of credits for each class</b></h3>
        </div>
        <div className="gpa-calculator">
          {entries}
          <button onClick={() => this.handleEntryAddition()} type="button" className="add-button">Add a semester</button>
        </div>
      </div>
    );
  }
}


export default GradesProcessor;
