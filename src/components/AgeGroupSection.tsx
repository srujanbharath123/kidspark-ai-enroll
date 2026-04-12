import { motion } from "framer-motion";
import { Gamepad2, Code2 } from "lucide-react";

const AgeGroupSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Built for <span className="text-gradient">Every Age</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Different ages, different pace — same excitement.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border/50 p-8 shadow-card hover:shadow-elevated transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
              <Gamepad2 className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-xl font-bold font-display mb-1">Young Explorers</h3>
            <p className="text-sm font-medium text-secondary mb-4">Ages 8–11</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Start your AI adventure. Learn to chat with AI, make art, write stories, and create your first AI project — it's easier than you think and way more fun than you'd expect.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border/50 p-8 shadow-card hover:shadow-elevated transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Code2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-display mb-1">Teen Creators</h3>
            <p className="text-sm font-medium text-primary mb-4">Ages 12–16</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Use the tools professionals actually use. Build AI projects, automate boring tasks, generate ideas on demand, and create things that make people ask — "how did you do that?"
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgeGroupSection;