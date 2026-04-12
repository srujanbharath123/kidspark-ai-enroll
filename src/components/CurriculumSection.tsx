import { motion } from "framer-motion";
import { MessageSquare, Lightbulb, Palette, PenTool, Brain, Award } from "lucide-react";

const modules = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Talk to AI Like a Pro",
    description: "Master the art of prompting and get AI to do exactly what you need.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Build Your First AI Project",
    description: "Turn your idea into something real, from scratch, in one session.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Create with AI",
    description: "Generate art, videos, presentations, and content that looks professional.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: "Write Smarter",
    description: "Use ChatGPT to write stories, scripts, essays, and pitches faster and better.",
    color: "bg-success/10 text-success",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Think Like a Problem-Solver",
    description: "Use AI to research, brainstorm, and plan like the pros do.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Pitch Your Idea",
    description: "Present your project to the group on the final day and take home your certificate.",
    color: "bg-accent/10 text-accent",
  },
];

const CurriculumSection = () => {
  return (
    <section id="curriculum" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            What Your Child Will <span className="text-gradient">Learn</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Six hands-on modules designed to take kids from curious to confident with AI.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 h-full">
                <div className={`w-14 h-14 rounded-2xl ${mod.color} flex items-center justify-center mb-4`}>
                  {mod.icon}
                </div>
                <h3 className="text-lg font-bold font-display mb-2">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CurriculumSection;