import "./IngredientInput.css"

export default function IngredientInput({ index, listLength, value, handleIngredientAdd, handleRemoveClick, handleIngredientChange }) {
  function handleIngredientEnter(e) {
    if (listLength - 1 === index && e.key === "Enter") {
      handleIngredientAdd()
    }
  }

  return (
    <>
      <div className="ingredientRow">
          <label className="ingredientLabel" htmlFor={`ingredient${index}`}>Zutat {index + 1}</label>
          <input
            className="ingredientInput"
            type="text"
            name={`ingredient${index}`}
            id={`ingredient${index}`}
            placeholder="Zutat"
            value={value}
            onChange={(e) => handleIngredientChange(e, index)}
            onKeyDown={handleIngredientEnter}
            autoFocus
          />
          {listLength > 1 && <button className="plusMinusButton" onClick={(e) => handleRemoveClick(e, index)}>-</button>}
          {listLength - 1 === index && <button className="plusMinusButton" onClick={() => handleIngredientAdd()}>+</button>}
      </div>
    </>
  )
}

