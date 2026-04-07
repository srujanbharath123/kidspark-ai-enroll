import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, Zap, BookOpen, Star, ArrowRight, Check } from "lucide-react";

const courses = [
  {
    id: "crash",
    title: "3-Day AI Crash Course",
    subtitle: "Weekend Intensive",
    duration: "3 Days",
    originalPrice: 10000,
    discountedPrice: 2500,
    badge: "Most Popular",
    badgeColor: "gradient-accent",
    features: [
      "Introduction to AI & ChatGPT",
      "Create AI Art & Images",
      "Build a Mini AI Project",
      "Certificate of Completion",
      "Live Q&A with Trainer",
    ],
    icon: <Zap className="w-6 h-6" />,
    accentClass: "text-accent",
  },
  {
    id: "monthly",
    title: "1-Month AI Program",
    subtitle: "Deep Dive",
    duration: "4 Weeks",
    originalPrice: 25000,
    discountedPrice: 8500,
    badge: "Best Value",
    badgeColor: "gradient-primary",
    features: [
      "Everything in Crash Course",
      "Advanced AI Tools & Coding",
      "Build 5+ Real Projects",
      "1-on-1 Mentorship Sessions",
      "Portfolio & Certificate",
      "Parent Progress Reports",
    ],
    icon: <BookOpen className="w-6 h-6" />,
    accentClass: "text-primary",
  },
];

const CoursesSection = () => {
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative"
            >
              <div className="relative bg-card rounded-3xl border border-border/50 p-8 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                {/* Badge */}
                <div className={`absolute top-6 right-6 ${course.badgeColor} text-primary-foreground text-xs font-bold px-3 py-1 rounded-full`}>
                  {course.badge}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 ${course.accentClass}`}>
                  {course.icon}
                </div>

                <p className="text-sm font-medium text-muted-foreground mb-1">{course.subtitle}</p>
                <h3 className="text-2xl font-bold font-display mb-2">{course.title}</h3>

                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.duration}</span>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 my-6">
                  <span className="text-4xl font-bold font-display text-foreground">₹{course.discountedPrice.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{course.originalPrice.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-success">
                    {Math.round(((course.originalPrice - course.discountedPrice) / course.originalPrice) * 100)}% OFF
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {course.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="hero" size="lg" className="w-full">
                  Enroll Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
