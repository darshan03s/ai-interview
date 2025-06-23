import { Routes, Route } from "react-router-dom";
import { Home, Interview } from "@/pages";
import Header from "@/components/Header";
import { Toaster } from "./components/ui/sonner";

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview/:interviewId" element={<Interview />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
