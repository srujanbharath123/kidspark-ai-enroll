import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CTASection = () => {
  const { user } = useAuth();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Limited Seats — Enroll Today!</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6">
            Give Your Child the <span className="text-gradient">AI Advantage</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join 500+ families who've already enrolled. Early bird discount ending soon — save up to 75%!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start Enrollment"} <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#courses">View Courses</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
