import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Parent of Arjun, 12",
    text: "My son built an AI chatbot in just 3 days! He's now obsessed with technology and wants to learn more. Best investment we've made.",
    rating: 5,
  },
  {
    name: "Rahul Mehta",
    role: "Parent of Ananya, 10",
    text: "The trainers are incredibly patient and skilled. Ananya went from zero coding knowledge to creating her own AI art gallery.",
    rating: 5,
  },
  {
    name: "Sneha Gupta",
    role: "Parent of Karan, 14",
    text: "The bootcamp was comprehensive and well-structured. Karan's confidence with technology has skyrocketed. Highly recommend!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Parents <span className="text-gradient">Love Us</span>
          </h2>
          <p className="text-lg text-muted-foreground">See what families are saying about Tech Windows.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-elevated transition-all duration-300 h-full flex flex-col">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;