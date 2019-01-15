'use-strict'
import React from "react";
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scalePoint } from 'd3-scale';
import { select as d3Select, } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { max } from 'd3-array';

let defaultMaximumGPA = 4.1 //The maximum GPA will be the upper bound of the y-axis in the graph

let graph = {
    svg: undefined,
    xScale: undefined,
    yScale: undefined,
    lineGenerator: undefined,
}

function initializeGraph(graphSelector) {
    let margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    },
        width = 750,
        height = 350;

    let svg = d3Select(graphSelector).append("svg")
        .attr("height", height + margin.top + margin.bottom)
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    let xScale = scalePoint()
        .range([0, width])
        .padding(0.3)

    let yScale = scaleLinear()
        .domain([0, defaultMaximumGPA])
        .range([height, 0])

    let lineGenerator = line()
        .x((d) => xScale(d.semester))
        .y((d) => yScale(+d.grade))
        .curve(curveMonotoneX)

    graph.svg = svg
    graph.xScale = xScale
    graph.yScale = yScale
    graph.lineGenerator = lineGenerator
    graph.height = height
    graph.width = width
}

initializeGraph('#graph')


/**
 * update graph by removing all the dynamic stuff and graphing again according to the entries provided
 * @param {Array.<{semester: String, grade: Number}>} entries - The array of the semesters name and GPA grade value
 */
function updateGraph(entries) {
    const {
        svg,
        lineGenerator,
        xScale,
        yScale,
        height,
    } = graph

    //Update the axis properties
    xScale.domain(entries.map((e) => e.semester))
    let maximumGPAValues = max(entries, (e) => e.grade) || 0
    yScale.domain([0, defaultMaximumGPA > maximumGPAValues ? defaultMaximumGPA : maximumGPAValues])

    //Clean up the graph before removing elements
    //TODO: Animate transitions
    svg.selectAll(".x-axis").remove()
    svg.selectAll(".y-axis").remove()
    svg.selectAll(".line").remove()
    svg.selectAll(".mark").remove()

    // x-axis component
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(axisBottom()
            .scale(xScale));

    //y-axis component
    svg.append("g")
        .attr("class", "y-axis")
        .call(axisLeft(yScale));

    svg.append("path")
        .datum(entries)
        .attr("class", "line")
        .attr("d", lineGenerator);

    svg.selectAll(".mark")
        .data(entries)
        .enter().append("circle")
        .attr("class", "mark")
        .attr("cx", (d) => xScale(d.semester))
        .attr("cy", (d) => yScale(+d.grade))
        .attr("r", 5)
}

updateGraph([]) //Draw initial empty graph


class Graph extends React.Component {
    constructor(props) {
        super(props);
        this._entryKeyGen = 0
        this.state = {
            entriesData: new Map([[this.nextKey(), {}], [this.nextKey(), {}], [this.nextKey(), {}], [this.nextKey(), {}]]),
            currentGraphEntries: [], //ids of the semester entries present in the graph
        };
    }


    /**
     * key generator for grades
     */
    nextKey() {
        return this._entryKeyGen++
    }

    getEntriesArray() {
        let entries = [], graphedEntries = []
        for (let [id, value] of this.state.entriesData) {
            if (value.grade && value.semester) {
                graphedEntries.push(id)
                entries.push({ grade: value.grade, semester: value.semester })
            }
        }
        this.setState({ currentGraphEntries: graphedEntries })
        return entries
    }
    updateGraph() {
        updateGraph(this.getEntriesArray()) //passing to global function which update the graph
    }

    handleEntryAddition() {
        const data = new Map(this.state.entriesData)
        data.set(this.nextKey(), {})
        this.setState({ entriesData: data })
    }

    removeEntry(id) {
        if (this.state.entriesData.size === 1) {
            return
        }
        const data = new Map(this.state.entriesData)
        data.delete(id)
        this.setState({ entriesData: data }, () => { this.updateGraph() })
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

    handleSemesterNameUpdate(id, value) {
        this.changePropertyWithID('semester', id, value)
        if (this.state.entriesData.get(id).grade) {
            this.updateGraph()
        }
    }

    handleGradeInput(id, value) {
        if (isNaN(value)) {
            return
        }
        this.changePropertyWithID('grade', id, +value)
        if (this.state.entriesData.get(id).semester) {
            this.updateGraph()
        }
    }


    render() {
        let entries = []
        for (let id of this.state.entriesData.keys()) {
            entries.push(<SemesterGrade error={this.state.currentGraphEntries.includes(id) ? false : true}
                key={id} onEntryRemoval={() => this.removeEntry(id)}
                onSemesterNameInput={(value) => this.handleSemesterNameUpdate(id, value)}
                onGradeInput={(value) => this.handleGradeInput(id, value)}
            />)
        }
        return (
            <div className="gpa-calculator">
                {entries}
                <button onClick={() => this.handleEntryAddition()} type="button" className="add-button">Add a semester</button>
            </div>
        )
    }
}

/**
 * The semester and grade input entries
 * @param {*} props 
 */
function SemesterGrade(props) {
    return (
        <div className={`entry ${props.error ? 'error' : ''}`}>
            <div className="row">
                <button onClick={() => props.onEntryRemoval()} type="button" className="delete-button">x</button>
            </div>
            <div className="row">
                <input onBlur={(event) => props.onSemesterNameInput(event.target.value)} type="text" placeholder="Semester Name" />
            </div>
            <div className="row">
                <input onBlur={(event) => props.onGradeInput(event.target.value)} type="text" placeholder="Semester Grade" />
            </div>
        </div>
    )
}

export default Graph;
