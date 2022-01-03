export default function FilterOptionCheckbox({ sectionName, state, value, icon, changeHandler }) {
  return (
    <div className="filterOption">
      <label htmlFor={value}>{icon} {value}</label>
      <input
        type="checkbox"
        id={value}
        name={sectionName}
        value={value}
        checked={state.includes(value)}
        onChange={changeHandler}
      />
    </div>
  )
}