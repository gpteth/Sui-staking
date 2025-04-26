import React,{useEffect} from "react";
import { useTheme } from "./providers/theme/ThemeContext";
import { NavigationProvider } from "./providers/navigation/NavigationProvider";
import { useNavigation } from "./providers/navigation/NavigationContext";
import WalletView from "./views/WalletView";
import HomeView from "./views/HomeView";
import { Staking } from "./components/Staking";

const Pages: React.FC = () => {
  const { currentPage } = useNavigation();

  switch (currentPage) {
    case "/":
    case "":
      return <HomeView />;
    case "/wallet":
      return <WalletView />;
    case "/staking":
      return <Staking />;
    default:
      return <div className="text-center">Page not found!</div>;
  }
};

const App: React.FC = () => {
  const { darkMode }  = useTheme();
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  return (
    <NavigationProvider>
      <div className={`${darkMode ? "dark" : ""}`}>
        <Pages />
      </div>
    </NavigationProvider>
  );
};

export default App;
