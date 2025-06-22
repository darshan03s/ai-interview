import { ThemeToggleButton } from "@/features/theme";

const Home = () => {
  return (
    <>
      <div className="fixed bottom-4 left-4">
        <ThemeToggleButton />
      </div>
      <div className="flex flex-col gap-4 items-center justify-center min-h-screen h-full bg-white dark:bg-black colors-smooth">
        <h1 className="text-4xl font-bold text-black dark:text-white">Home</h1>
      </div>
    </>
  );
};

export default Home;
