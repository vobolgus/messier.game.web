import React from 'react';
import './ScoreboardList.css'; // Optional: for specific ScoreboardList styles

function ScoreboardList({ scores }) {
  if (!scores || scores.length === 0) {
    return <p>No scores available.</p>;
  }

  return (
    <table className="scoreboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Score</th>
          <th>Difficulty</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((entry, index) => (
          <tr key={entry.id || index}> {/* Use entry.id if available, otherwise index */}
            <td>{index + 1}</td>
            <td>{entry.username}</td>
            <td>{entry.score}</td>
            <td>{entry.difficulty}</td>
            <td>{new Date(entry.timestamp).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ScoreboardList;

