import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CurriculumSection from "@/components/CurriculumSection";
import AgeGroupSection from "@/components/AgeGroupSection";
import CoursesSection from "@/components/CoursesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DayTimelineSection from "@/components/DayTimelineSection";
import InstructorSection from "@/components/InstructorSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import StickyEnrolBar from "@/components/StickyEnrolBar";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CurriculumSection />
      <AgeGroupSection />
      <CoursesSection />
      <HowItWorksSection />
      <DayTimelineSection />
      <InstructorSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <StickyEnrolBar />
    </div>
  );
};

export default Index;