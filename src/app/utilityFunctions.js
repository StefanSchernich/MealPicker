
export function markCheckedInputs() {
  const inputs = document.querySelectorAll("input[type='radio'], input[type='checkbox']")
  for (let input of inputs) {
    if (input.checked) {
      input.parentNode.classList.add("selectedOption")
    } else {
      input.parentNode.classList.remove("selectedOption")
    }
  }
}


