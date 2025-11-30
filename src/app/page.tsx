import Navbar from "./components/common/navbar";
import Hero from "./components/landing/hero";
import Features from "./components/landing/features";
import FAQs from "./components/landing/faqs";
import Footer from "./components/common/footer";

export default function Home() {
  return (
    <>
      <div>
        <Navbar />
        <Hero />
        <Features />
        <FAQs />  
        <Footer />
      </div>


    </>
  );
}
