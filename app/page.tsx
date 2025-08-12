// ...existing code...
import Footer from "./component/landingpage/footer";
import HeroSection from "./component/landingpage/HeroSection";
import InfoSection from "./component/landingpage/infoSection";
import NavBar from "./component/landingpage/NavBar";
import NewsUpdates from "./component/landingpage/NewsUpdates";

export default function Home() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <NavBar hideAdminLogin={true} />
      <div style={{ height: '20px' }}></div>
      <main className="flex-grow">
        <HeroSection />
        <NewsUpdates />
        <InfoSection />
        {/* Comments component removed due to missing file */}
      </main>
      <Footer />
    </div>
  );
}
