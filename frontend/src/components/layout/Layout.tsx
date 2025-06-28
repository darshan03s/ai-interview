import { Outlet } from "react-router-dom";
import Header from "./Header";

const Layout = () => {
    return (
        <div className="min-h-screen h-full flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto">
                <div className="min-h-[calc(100vh-4rem)] h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;