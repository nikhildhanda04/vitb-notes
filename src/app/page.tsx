import Navbar from "@/components/common/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import FAQs from "@/components/landing/faqs";
import Footer from "@/components/common/footer";
import { ContactForm } from "@/components/landing/contact";

export default function Home() {
  return (
    <>

      <Navbar />
      <Hero />
      <Features />
      <FAQs />
      <ContactForm />
      <Footer />



    </>
  );
}
