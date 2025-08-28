import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import App from "./App.tsx"
import { AppProvider } from "./contexts/AppContext"
import "./i18n"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </Router>
    </AppProvider>
  </React.StrictMode>,
)
