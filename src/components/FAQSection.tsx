import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "What age group is this bootcamp for?",
    a: "Our AI bootcamp is designed for children aged 8–16. We have different difficulty levels to match each child's abilities.",
  },
  {
    q: "Does my child need prior coding experience?",
    a: "Not at all! Our courses start from the basics and gradually progress. We make learning fun and accessible for complete beginners.",
  },
  {
    q: "What tools will my child learn?",
    a: "Kids will learn ChatGPT, AI image generators (like DALL-E), basic coding with Python, and various no-code AI tools to build real projects.",
  },
  {
    q: "Are the sessions live or pre-recorded?",
    a: "All sessions are live and interactive with expert trainers. This ensures personalized attention and real-time Q&A for every student.",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a full refund if you cancel before the first session. After the course begins, we provide a pro-rated refund based on completed sessions.",
  },
  {
    q: "Will my child receive a certificate?",
    a: "Yes! Every student receives a certificate of completion after finishing their course, which they can proudly share.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-card rounded-2xl border border-border/50 px-6 shadow-card"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
