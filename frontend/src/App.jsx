import { useState } from 'react'
import './App.css'

const fields = [
  {
    key: 'distance_from_home',
    label: 'Distance From Home',
    helper: 'Miles from cardholder home',
  },
  {
    key: 'distance_from_last_transaction',
    label: 'Distance From Last Transaction',
    helper: 'Miles from previous purchase',
  },
  {
    key: 'ratio_to_median_purchase_price',
    label: 'Purchase Ratio',
    helper: 'Compared to median spend',
  },
  {
    key: 'repeat_retailer',
    label: 'Repeat Retailer',
    helper: 'Use 1.0 or 0.0',
  },
  {
    key: 'used_chip',
    label: 'Used Chip',
    helper: 'Use 1.0 or 0.0',
  },
  {
    key: 'used_pin_number',
    label: 'Used PIN Number',
    helper: 'Use 1.0 or 0.0',
  },
  {
    key: 'online_order',
    label: 'Online Order',
    helper: 'Use 1.0 or 0.0',
  },
]

const createEmptyRow = () => ['', '', '', '', '', '', '']
const headers = fields.map((field) => field.key)

const formatDecimal = (value) => value.toFixed(1)

const normalizeNumericValue = (value) => {
  const trimmedValue = String(value).trim()

  if (!trimmedValue) {
    return ''
  }

  const numericValue = Number(trimmedValue)

  if (Number.isNaN(numericValue)) {
    return trimmedValue
  }

  return formatDecimal(numericValue)
}

const randomDecimal = (min, max) =>
  formatDecimal(Math.random() * (max - min) + min)

const randomBinaryDecimal = () => formatDecimal(Math.random() < 0.5 ? 0 : 1)

const createGeneratedRow = () => [
  randomDecimal(0.2, 150.0),
  randomDecimal(0.1, 80.0),
  randomDecimal(0.1, 12.0),
  randomBinaryDecimal(),
  randomBinaryDecimal(),
  randomBinaryDecimal(),
  randomBinaryDecimal(),
]

const createGeneratedRows = (count) =>
  Array.from({ length: count }, () => createGeneratedRow())

const getFraudPayload = (result) =>
  result['Fraud Values'] ?? result.fraudValues ?? result.fraud_values ?? {}

const normalizeHeader = (header) => header.trim().toLowerCase()

const parseCSVText = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row.')
  }

  const parsedHeaders = lines[0].split(',').map(normalizeHeader)
  const expectedHeaders = headers.map(normalizeHeader)

  const headersMatch =
    parsedHeaders.length === expectedHeaders.length &&
    parsedHeaders.every((header, index) => header === expectedHeaders[index])

  if (!headersMatch) {
    throw new Error('CSV headers must match the fraud detection input columns.')
  }

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => normalizeNumericValue(value))

    if (values.length !== headers.length) {
      throw new Error('Each CSV row must include all 7 values.')
    }

    return values
  })
}

const buildResultTable = (result) => {
  const fraudPayload = getFraudPayload(result)
  const columns = Object.keys(fraudPayload)

  if (!columns.length) {
    return { columns: [], rows: [] }
  }

  const rowIndexes = Array.from(
    new Set(
      columns.flatMap((column) =>
        Object.keys(fraudPayload[column] ?? {}).map((key) => Number(key)),
      ),
    ),
  ).sort((a, b) => a - b)

  const tableRows = rowIndexes.map((rowIndex) =>
    columns.reduce((row, column) => {
      row[column] = fraudPayload[column]?.[rowIndex] ?? ''
      return row
    }, {}),
  )

  return { columns, rows: tableRows }
}

const getFraudLevelClassName = (fraudValue) => {
  const numericFraudValue = Number(fraudValue)

  if (numericFraudValue > 0.7) {
    return 'result-row result-row-danger'
  }

  if (numericFraudValue > 0.45) {
    return 'result-row result-row-warning'
  }

  return 'result-row'
}

const formatFraudDisplay = (fraudValue) => {
  const numericFraudValue = Number(fraudValue)

  if (Number.isNaN(numericFraudValue)) {
    return String(fraudValue)
  }

  return `${(numericFraudValue * 100).toFixed(1)}%`
}

const getResultColumnLabel = (column) => {
  const columnLabels = {
    distance_from_home: 'Dist. Home',
    distance_from_last_transaction: 'Dist. Last Txn',
    ratio_to_median_purchase_price: 'Purchase Ratio',
    repeat_retailer: 'Repeat',
    used_chip: 'Chip',
    used_pin_number: 'PIN',
    online_order: 'Online',
    fraud: 'Fraud %',
  }

  return columnLabels[column] ?? column
}

function App() {
  const [rows, setRows] = useState([createEmptyRow()])
  const [resultColumns, setResultColumns] = useState([])
  const [resultRows, setResultRows] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (rowIndex, colIndex, value) => {
    setRows((currentRows) =>
      currentRows.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cell, currentColIndex) =>
              currentColIndex === colIndex ? value : cell,
            )
          : row,
      ),
    )
  }

  const handleBlur = (rowIndex, colIndex) => {
    setRows((currentRows) =>
      currentRows.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cell, currentColIndex) =>
              currentColIndex === colIndex ? normalizeNumericValue(cell) : cell,
            )
          : row,
      ),
    )
  }

  const addRow = () => {
    setRows((currentRows) => [...currentRows, createEmptyRow()])
  }

  const generateRowValues = (rowIndex) => {
    setRows((currentRows) =>
      currentRows.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex ? createGeneratedRow() : row,
      ),
    )
  }

  const generateDataRows = () => {
    setRows(createGeneratedRows(5))
  }

  const removeRow = (rowIndex) => {
    const updatedRows = rows.filter((_, index) => index !== rowIndex)
    setRows(updatedRows.length ? updatedRows : [createEmptyRow()])
  }

  const convertToCSV = () => {
    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((value) => normalizeNumericValue(value)).join(',')),
    ]
    return csvRows.join('\n')
  }
  const downloadCSV = () => {
    const csvString = convertToCSV()
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'debug_data.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  const submitCSVBlob = async (csvBlob) => {
    const formData = new FormData()
    formData.append('file', csvBlob, 'data.csv')

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('http://127.0.0.1:8000/test', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to send CSV')
      }

      const result = await response.json()
      const { columns, rows: resultTableRows } = buildResultTable(result)

      setResultColumns(columns)
      setResultRows(resultTableRows)
    } catch (error) {
      console.error(error)
      setErrorMessage('Error sending CSV')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const csvString = convertToCSV()
    const csvBlob = new Blob([csvString], { type: 'text/csv' })
    await submitCSVBlob(csvBlob)
  }

  const handleUploadCSV = async (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const csvText = await file.text()
      const parsedRows = parseCSVText(csvText)
      setRows(parsedRows)

      const csvBlob = new Blob([csvText], { type: 'text/csv' })
      await submitCSVBlob(csvBlob)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not upload CSV.',
      )
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Credit Card Fraud Detection</p>
          <h2>Evaluate Credit Card Transaction Data Instantly.</h2>
          <p className="hero-description">
            Upload a CSV file, or press "Generate Data" allowing you to
            generate realistic transaction inputs, adjust fields manually,
            and submit batches to review fraud risk row by row.
          </p>
        </div>
        <div className="buttons">
          <label className="button button-primary button-upload">
            {isSubmitting ? 'Uploading...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden-file-input"
              onChange={handleUploadCSV}
              disabled={isSubmitting}
            />
          </label>
        </div>
      </header>

      <section className="workspace-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Input Workspace</p>
            <h2>Transaction Feature Matrix</h2>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={generateDataRows}
          >
            Generate Data
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="matrix-guide">
            {fields.map((field) => (
              <div key={field.key} className="matrix-guide-item">
                <span className="field-label">{field.label}</span>
                <span className="field-helper">{field.helper}</span>
              </div>
            ))}
          </div>

          <div className="rows-stack">
            {rows.map((row, rowIndex) => (
              <article key={rowIndex} className="input-row-card">
                <div className="row-card-header">
                  <span className="row-index-label">Row {rowIndex + 1}</span>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => generateRowValues(rowIndex)}
                    >
                      Generate Values
                    </button>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => removeRow(rowIndex)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="row-fields-grid">
                  {row.map((value, colIndex) => (
                    <label key={headers[colIndex]} className="field-card">
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) =>
                          handleChange(rowIndex, colIndex, e.target.value)
                        }
                        onBlur={() => handleBlur(rowIndex, colIndex)}
                        placeholder={headers[colIndex]}
                        className="value-input"
                        required
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="button button-secondary"
              onClick={downloadCSV}
            >
              Download CSV
            </button>

            <div className="actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={addRow}
              >
                Add Row
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Score Transactions'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      {resultRows.length ? (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Model Output</p>
              <h2>Fraud Risk Results</h2>
            </div>
            <p className="section-description">
              Yellow rows need review. Red rows indicate the highest fraud
              likelihood.
            </p>
          </div>

          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  {resultColumns.map((column) => (
                    <th key={column} title={column}>
                      {getResultColumnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {resultRows.map((resultRow, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={getFraudLevelClassName(resultRow.fraud)}
                  >
                    {resultColumns.map((column) => (
                      <td key={column}>
                        {column === 'fraud'
                          ? formatFraudDisplay(resultRow[column])
                          : String(resultRow[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <footer className="project-footer">
        <span>Built as a machine learning fraud detection project.</span>
        <a
          href="https://github.com/bmcallaway/CreditCardFraudDetection"
          target="_blank"
          rel="noreferrer"
          className="project-link"
          aria-label="View the project on GitHub"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="github-icon"
          >
            <path
              fill="currentColor"
              d="M12 .5C5.65.5.5 5.66.5 12.03c0 5.1 3.3 9.42 7.87 10.95.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.17a10.9 10.9 0 0 1 5.78 0c2.2-1.49 3.16-1.17 3.16-1.17.63 1.58.24 2.75.12 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.17 0 1.57-.01 2.83-.01 3.21 0 .31.21.68.8.56A11.54 11.54 0 0 0 23.5 12.03C23.5 5.66 18.35.5 12 .5Z"
            />
          </svg>
        </a>
      </footer>
    </div>
  )
}

export default App
