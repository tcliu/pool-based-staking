import * as React from 'react'
import { render } from 'react-dom'
import { createRoot } from 'react-dom/client'
import store from './store'
import { Provider } from 'react-redux'
import { AppStateView } from './components/app-state-view'

const container = document.getElementById('root')
const root = createRoot(container!)
import './styles.css'

function App() {
  return <AppStateView />
}

root.render(
  <Provider store={store}>
    <App />
  </Provider>
)
