import React from 'react';

interface VoteResult {
  date: string;
  hour: number;
  minute: number;
  count: number;
}

interface VoteResultsTableProps {
  results: VoteResult[];
}

const VoteResultsTable: React.FC<VoteResultsTableProps> = ({ results }) => {
  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="vote-results">
      <h3>Vote Results</h3>
      {results.length === 0 ? (
        <p>No votes yet. Be the first to vote!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Votes</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{formatDate(result.date)}</td>
                <td style={{ padding: '12px' }}>{formatTime(result.hour, result.minute)}</td>
                <td style={{ padding: '12px' }}>{result.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VoteResultsTable;
