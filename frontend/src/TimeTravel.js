function TimeTravel({ onChange }) {
    return (
      <div style={{ marginBottom: 15 }}>
        <label>⏳ Time Travel</label><br />
        <input
          type="datetime-local"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  
  export default TimeTravel;
  