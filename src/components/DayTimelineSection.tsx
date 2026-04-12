import { motion } from "framer-motion";

const timeline = [
  { time: "9:00 AM", label: "Welcome, introductions & icebreaker activity" },
  { time: "9:30 AM", label: "What is AI? How does it think? (interactive demo)" },
  { time: "10:15 AM", label: "Hands-on: students use ChatGPT and Claude for the first time" },
  { time: "11:15 AM", label: "Break + informal Q&A" },
  { time: "11:30 AM", label: "Project session: each student builds their own AI mini-project" },
  { time: "1:00 PM", label: "Showcase — students present to the group" },
  { time: "1:30 PM", label: "Wrap-up, certificates & what's next" },
];

const DayTimelineSection = () => {
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
            A Day at the <span className="text-gradient">Bootcamp</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Here's what a typical bootcamp day looks like for your child.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[60px] sm:left-[72px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-1">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-4 sm:gap-6 py-4"
                >
                  <div className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap w-[52px] sm:w-[60px] text-right pt-0.5 shrink-0">
                    {item.time}
                  </div>
                  <div className="relative shrink-0">
                    <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background mt-1" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DayTimelineSection;