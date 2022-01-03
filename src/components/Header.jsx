import './Header.css'
import React from 'react'
import { Link } from "react-router-dom"


export default function Header(props) {
  return (
    <header>
      <div className="pageHeader">
        <p className="pageTitle">Meal <span className="fancyWord">Picker</span> <span className='pageLogo'>🌮</span></p>
      </div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/addRecipe">Neues Rezept erstellen</Link>
      </nav>
    </header>
  )
}