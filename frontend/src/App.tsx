import { Routes, Route, useNavigate } from "react-router-dom";
import { Home, Interview } from "@/pages";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/layout/Layout";
import { useAuth } from "./features/auth/useAuth";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/");
    }
  }, [session, navigate, authLoading]);

  return children;
};

const App = () => {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/interview/:interviewId" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
