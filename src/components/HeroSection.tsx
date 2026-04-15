import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, Brain, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_NUMBER = "919876543210";
const WHATSAPP_MSG = encodeURIComponent("Hi! I'd like to know more about the Tech Windows AI Bootcamp for my child.");

const FloatingIcon = ({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) => (
  <motion.div
    className={`absolute ${className}`}
    animate={{ y: [-8, 8, -8] }}
    transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <div className="w-14 h-14 rounded-2xl bg-card shadow-elevated flex items-center justify-center">{children}</div>
  </motion.div>
);

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden flex items-center pt-16">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ages 8–16 · Limited Seats Available</span>
            </div>
          </motion.div> */}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight mb-6"
          >
            Your Child's AI Adventure <br className="hidden sm:block" />
            <span className="text-gradient">Starts Here</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Tech Windows is a hands-on AI bootcamp for kids aged 8–16. They'll learn to use ChatGPT, Claude, and other
            real AI tools to build projects, solve problems, and bring their ideas to life — no coding experience
            needed, just curiosity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {user ? (
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/enroll">
                    Enroll Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <a href="#curriculum">See What We Teach</a>
                </Button>
              </>
            )}
          </motion.div>

          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-4"
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Questions? Chat with us on WhatsApp
              </a>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>500+ Students Enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>4.9★ Parent Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>Expert Trainers</span>
            </div>
          </motion.div>
        </div>

        <FloatingIcon delay={0} className="top-10 left-[10%] hidden lg:flex">
          <Brain className="w-7 h-7 text-primary" />
        </FloatingIcon>
        <FloatingIcon delay={0.5} className="top-20 right-[12%] hidden lg:flex">
          <Rocket className="w-7 h-7 text-secondary" />
        </FloatingIcon>
        <FloatingIcon delay={1} className="bottom-32 left-[15%] hidden lg:flex">
          <Sparkles className="w-7 h-7 text-accent" />
        </FloatingIcon>
      </div>
    </section>
  );
};

export default HeroSection;
