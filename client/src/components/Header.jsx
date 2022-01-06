import './Header.css'
import React from 'react'
import { Link, useNavigate } from "react-router-dom"
import { resetStatus } from '../features/Recipe/recipeSlice'
import { useDispatch } from 'react-redux'


export default function Header(props) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  return (
    <header>
      <div className="pageHeader" onClick={() => {
        dispatch(resetStatus());
        navigate("/")
      }}>
        <p className="pageTitle">Meal <span className="fancyWord">Picker</span> <span className='pageLogo'>🌮</span></p>
      </div>
      <nav>
        <Link to="/addRecipe">Neues Rezept erstellen</Link>
      </nav>
    </header>
  )
}