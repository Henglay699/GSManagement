import { Route, Routes } from "react-router-dom";
import UserPage from "./pages/UserPage";

function App() {
  return (
    <main className="contaner">
      <Routes>
        <Route path="/" element={<UserPage />}></Route>
      </Routes>
    </main>
  );
}
export default App;
