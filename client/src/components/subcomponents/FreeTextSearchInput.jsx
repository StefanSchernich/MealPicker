export default function FreeTextSearchInput({ value, index, listLength, handleTextSearchChange, handleTextSearchAdd, handleTextSearchRemove }) {
	return (
		<div className='textSearchContainer'>
			<div className='textSearchBar'>
				<input id='ingTextSearch' type='text' placeholder='Freitext Zutat' value={value} onChange={(e) => handleTextSearchChange(e, index)} />
				<i className='fa-solid fa-magnifying-glass'></i>
			</div>
			{listLength > 1 && (
				<button className='plusMinusButton' onClick={(e) => handleTextSearchRemove(e, index)}>
					-
				</button>
			)}
			{listLength - 1 === index && (
				<button className='plusMinusButton' onClick={() => handleTextSearchAdd()}>
					+
				</button>
			)}
		</div>
	);
}
