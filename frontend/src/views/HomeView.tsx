import { FC } from "react";
import NavBar from "../components/shared/Navbar";
import { useTheme } from "../providers/theme/ThemeContext";
const HomeView: FC = () => {
  const { darkMode } = useTheme();
  return (
    <>
      <div
        className={"min-h-screen flex flex-col items-center ${darkMode ? 'text-white' : 'text-gray-800'} bg-cover bg-center bg-fixed"}
        style={{
          backgroundImage: darkMode ? "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/farm_bg.png')" : "linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url('farm_bg.png')",
        }}
      >
        <NavBar />
        {/* Hero Section */}
        <div className={`w-full text-center py-16 px-4 ${darkMode ? 'bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px]' : 'bg-gradient-to-r from-white/30 to-white/30 backdrop-blur-[2px]'}`}>
          <h1 className={`text-9xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
            FARM
          </h1>
          <p className={`text-xl max-w-3xl mx-auto mb-8 ${darkMode ? 'text-cyan-50' : 'text-blue-800'}`}>
            Meet FARM, the cutest meme coin floating through the blockchain ocean! Dive into a world of fun, community, and rewards.
          </p>
        </div>

        {/* Features Section */}
        <div className="w-full bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px] py-12 px-6">
          <h2 className="text-5xl font-bold text-center mb-8 text-cyan-100">Why Choose FARM?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Community-Driven</h3>
              <p className="text-lg text-cyan-50">FARM is powered by the community, creating a strong and friendly ecosystem.</p>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Deflationary</h3>
              <p className="text-lg text-cyan-50">With every transaction, a portion is burned to ensure scarcity and increase value.</p>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Adorable Branding</h3>
              <p className="text-lg text-cyan-50">FARM's unique farm theme makes it a standout in the meme coin world.</p>
            </div>
          </div>
        </div>

        {/* Tokenomics Section */}
        <div className="w-full bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px] py-12 px-6">
          <h2 className="text-5xl font-bold text-center mb-8 text-cyan-100">Tokenomics</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-2 text-cyan-200">Total Supply</h3>
              <p className="text-lg text-cyan-50">1 Billion FARM</p>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-2 text-cyan-200">Community Wallet</h3>
              <p className="text-lg text-cyan-50">90% for the community</p>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-2 text-cyan-200">Marketing</h3>
              <p className="text-lg text-cyan-50">10% for growth and adoption</p>
            </div>
          </div>
        </div>

        {/* Roadmap Section */}
        <div className="w-full bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px] py-12 px-6">
          <h2 className="text-5xl font-bold text-center mb-12 text-cyan-100">Roadmap</h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Phase 1: Launch</h3>
              <ul className="space-y-3 text-lg text-cyan-50">
                <li>• Website Launch</li>
                <li>• Community Building</li>
                <li>• Token Launch</li>
                <li>• Initial Marketing Push</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Phase 2: Growth</h3>
              <ul className="space-y-3 text-lg text-cyan-50">
                <li>• Exchange Listings</li>
                <li>• Partnership Development</li>
                <li>• Community Events</li>
                <li>• NFT Collection Launch</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Phase 3: Expansion</h3>
              <ul className="space-y-3 text-lg text-cyan-50">
                <li>• Major Exchange Listings</li>
                <li>• FARM Ecosystem Development</li>
                <li>• Cross-Chain Integration</li>
                <li>• Mobile App Development</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Phase 4: Evolution</h3>
              <ul className="space-y-3 text-lg text-cyan-50">
                <li>• Governance Implementation</li>
                <li>• DeFi Integration</li>
                <li>• Global Marketing Campaign</li>
                <li>• Community-Led Development</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contract & Social Section */}
        <div className="w-full bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px] py-12 px-6 text-center">
          <h2 className="text-5xl font-bold text-center mb-8 text-cyan-100">Contract & Community</h2>

          {/* Contract Address */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-black/20 to-blue-900/10 p-8 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20">
              <h3 className="text-3xl font-bold mb-4 text-cyan-200">Contract Address</h3>
              <div className="flex items-center justify-center space-x-4">
                <p className="text-lg text-cyan-50 font-mono">
                  {/* Note: The href link might also need updating if the contract path changed */}
                  <a href="https://suiscan.xyz/devnet/coin/0xb200680489fcedf93768eb35effb663d962757cc54ba58aa5c7b5478a4c89dd5::jelo::JELO/txs">
                    0xb200...9dd5::farm::FARM
                  </a>
                </p>
                <button className="bg-cyan-500/20 hover:bg-cyan-500/30 p-2 rounded-lg transition-all"
                  onClick={() => navigator.clipboard.writeText('0x1234...5678')}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <a href="#twitter" className="bg-gradient-to-br from-black/20 to-blue-900/10 p-6 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-xl font-bold mb-2 text-cyan-200">Twitter</h3>
              <p className="text-lg text-cyan-50">@FARM_coin</p>
            </a>
            <a href="#telegram" className="bg-gradient-to-br from-black/20 to-blue-900/10 p-6 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-xl font-bold mb-2 text-cyan-200">Telegram</h3>
              <p className="text-lg text-cyan-50">t.me/FARM</p>
            </a>
            <a href="#discord" className="bg-gradient-to-br from-black/20 to-blue-900/10 p-6 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-xl font-bold mb-2 text-cyan-200">Discord</h3>
              <p className="text-lg text-cyan-50">discord.gg/FARM</p>
            </a>
            <a href="#medium" className="bg-gradient-to-br from-black/20 to-blue-900/10 p-6 rounded-2xl shadow-xl backdrop-blur-[2px] border border-cyan-200/20 hover:transform hover:scale-105 transition-all">
              <h3 className="text-xl font-bold mb-2 text-cyan-200">Medium</h3>
              <p className="text-lg text-cyan-50">medium.com/FARM</p>
            </a>
          </div>
        </div>


        {/* Call to Action Section */}
        <div className="w-full bg-gradient-to-r from-black/10 to-black/10 backdrop-blur-[2px] py-16 px-6 text-center">
          <h2 className="text-5xl font-bold mb-4 text-cyan-100">Get Started with FARM</h2>
          <p className="text-xl mb-8 text-cyan-50">
            Don't miss your chance to be part of the most adorable coin on the blockchain. Join our community today!
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white px-10 py-5 rounded-full shadow-lg text-xl font-semibold transform hover:scale-105 transition-all">
              Add Liquidity
            </button>
            <button className="bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-5 rounded-full shadow-lg text-xl font-semibold transform hover:scale-105 transition-all">
              Join Community
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeView;
