import { Routes, Route } from "react-router-dom";
import { Home, Interview } from "@/pages";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/interview/:interviewId" element={<Interview />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
