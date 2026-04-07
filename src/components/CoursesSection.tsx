import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, Zap, BookOpen, Star, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  discount_price: number | null;
  features: string[] | null;
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (data) setCourses(data);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const badgeConfig: Record<number, { badge: string; color: string; accentClass: string; icon: React.ReactNode }> = {
    0: { badge: "Most Popular", color: "gradient-accent", accentClass: "text-accent", icon: <Zap className="w-6 h-6" /> },
    1: { badge: "Best Value", color: "gradient-primary", accentClass: "text-primary", icon: <BookOpen className="w-6 h-6" /> },
  };

  return (
    <section id="courses" className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Star className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Choose Your Path</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            AI Bootcamp <span className="text-gradient">Courses</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Designed for curious minds aged 8–16. Learn by building real AI projects.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {courses.map((course, i) => {
              const config = badgeConfig[i] || badgeConfig[0];
              const discountedPrice = course.discount_price || course.price;
              const discountPercent = course.discount_price
                ? Math.round(((course.price - course.discount_price) / course.price) * 100)
                : 0;

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="group relative"
                >
                  <div className="relative bg-card rounded-3xl border border-border/50 p-8 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                    <div className={`absolute top-6 right-6 ${config.color} text-primary-foreground text-xs font-bold px-3 py-1 rounded-full`}>
                      {config.badge}
                    </div>

                    <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 ${config.accentClass}`}>
                      {config.icon}
                    </div>

                    <h3 className="text-2xl font-bold font-display mb-2">{course.title}</h3>

                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{course.duration}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 mb-4">{course.description}</p>

                    <div className="flex items-baseline gap-3 my-6">
                      <span className="text-4xl font-bold font-display text-foreground">₹{discountedPrice.toLocaleString()}</span>
                      {course.discount_price && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">₹{course.price.toLocaleString()}</span>
                          <span className="text-sm font-semibold text-success">{discountPercent}% OFF</span>
                        </>
                      )}
                    </div>

                    {course.features && (
                      <ul className="space-y-3 mb-8">
                        {course.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Button variant="hero" size="lg" className="w-full" asChild>
                      <Link to="/signup">
                        Enroll Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
