/**
 * Ponto de entrada (Entry Point) da aplicação React do Popup.
 * Este arquivo renderiza o componente principal dentro do elemento raiz do HTML.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './Popup'
import './popup.css'

// Inicializa a árvore de componentes React no elemento DOM com id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)