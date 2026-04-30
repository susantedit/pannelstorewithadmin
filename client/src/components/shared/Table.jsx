export function Table({ columns, data, rowKey = 'id', onRowClick = null, loading = false }) {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="skeleton" style={{ height: '40px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '40px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '40px' }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? 'clickable' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
