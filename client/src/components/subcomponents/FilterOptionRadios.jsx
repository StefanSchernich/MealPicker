export default function FilterOptionRadios({ sectionName, state, icon, value, changeHandler, isRequired }) {

  return (
    <div className="filterOption">
      <label htmlFor={value}>{icon} {value}</label>
      <input
        type="radio"
        id={value}
        name={sectionName}
        value={value}
        checked={state === value}
        onChange={changeHandler}
        required={isRequired}
      />
    </div>
  )
}