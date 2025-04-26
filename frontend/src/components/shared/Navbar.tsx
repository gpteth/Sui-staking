import React from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { useTheme } from "../../providers/theme/ThemeContext";
import { useNavigation } from "../../providers/navigation/NavigationContext";

const NavBar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { navigate } = useNavigation();
  
  return (
    <nav className="bg-transparent p-4 shadow-md w-full">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-cyan-200 transition-colors"
          >
            首页
          </button>
          <button
            onClick={() => navigate("/staking")}
            className="text-white hover:text-cyan-200 transition-colors"
          >
            质押
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <span>🌞 Light</span> : <span>🌛 Dark</span>}
          </button>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
