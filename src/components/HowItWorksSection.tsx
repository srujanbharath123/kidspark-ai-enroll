import { motion } from "framer-motion";
import { UserPlus, BookOpen, CreditCard, Calendar } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: "Pick a Course",
    description: "Browse our bootcamp options and choose the right fit for your child.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Add Your Child's Details",
    description: "Tell us your child's name and age — takes less than a minute.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Secure Your Spot",
    description: "Complete payment with instant confirmation. Early bird discounts available.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Join Live Sessions",
    description: "Your child starts learning with expert trainers in small, supervised batches.",
    color: "bg-success/10 text-success",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Getting started is easy — just four simple steps.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="text-xs font-bold text-muted-foreground mb-4">STEP {i + 1}</div>
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold font-display mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;