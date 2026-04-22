export function PageIntro({ eyebrow, title, description, action }) {
  return (
    <section className="hero-panel overflow-hidden">
      <div className="hero-grid">
        <div>
          {eyebrow ? <div className="hero-eyebrow">{eyebrow}</div> : null}
          <h1 className="hero-title">{title}</h1>
          {description ? <p className="hero-copy">{description}</p> : null}
        </div>
        {action ? <div className="hero-action">{action}</div> : null}
      </div>
    </section>
  )
}

export function StatCard({ label, value, tone = 'default', helper }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '-'}</div>
      {helper ? <div className="stat-helper">{helper}</div> : null}
    </article>
  )
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`app-panel ${className}`.trim()}>
      {(title || subtitle || action) ? (
        <div className="panel-head">
          <div>
            {title ? <h2 className="panel-title">{title}</h2> : null}
            {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Pill({ children, tone = 'default' }) {
  return <span className={`app-pill pill-${tone}`}>{children}</span>
}

export function Message({ tone = 'error', children }) {
  return <div className={`app-message message-${tone}`}>{children}</div>
}

export function DataTable({ columns, rows, empty, renderRow }) {
  return (
    <div className="table-shell">
      <table className="app-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Field({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <label className={`field-shell ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </label>
  )
}

export function SelectField({ label, value, onChange, children, className = '' }) {
  return (
    <label className={`field-shell ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field-input">
        {children}
      </select>
    </label>
  )
}

export function ReadOnlyField({ label, value }) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      <div className="field-static">{value}</div>
    </label>
  )
}
