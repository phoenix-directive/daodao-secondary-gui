import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { LandingPage } from "./pages/LandingPage";
import { DaoPage } from "./pages/DaoPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dao/:address" element={<DaoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
