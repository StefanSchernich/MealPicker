import FilterOptionRadios from "./FilterOptionRadios"

export default function RadioFilterSection({ children, sectionName, state, dataArr, changeHandler, isRequired }) {
  const data = [...dataArr]
  return (
  <div className="filterSection">
    <span className="filterHeading">{children}</span>
    <div className="filterOptions">
      {data.map(({ id, value, icon }) => {
        return (
          <FilterOptionRadios key={id} sectionName={sectionName} state={state} value={value} icon={icon} changeHandler={changeHandler} isRequired={isRequired} />
        )
      })}
    </div>
  </div>
  )
}