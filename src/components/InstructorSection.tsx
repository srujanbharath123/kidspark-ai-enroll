import { motion } from "framer-motion";
import { Quote, ShieldCheck } from "lucide-react";

const InstructorSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Meet Your <span className="text-gradient">Instructor</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your child learns from someone who genuinely cares.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-card text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">👨‍🏫</span>
            </div>
            <h3 className="text-xl font-bold font-display mb-1">The Tech Windows Team</h3>
            <p className="text-sm text-primary font-medium mb-6">AI Educators & Technologists</p>

            <div className="bg-muted/50 rounded-xl p-6 mb-6">
              <Quote className="w-6 h-6 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                "We built Tech Windows because we kept thinking — if we'd had these tools when we were 12, there's no telling what we would have created. This bootcamp is our way of giving kids that head start."
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                Trained in child-safe AI education
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                All sessions fully supervised
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InstructorSection;