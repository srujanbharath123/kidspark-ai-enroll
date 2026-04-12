import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "Does my child need their own laptop?",
    a: "Yes — please bring a laptop or tablet with internet access. We'll take care of everything else.",
  },
  {
    q: "Is any prior coding or tech experience required?",
    a: "None at all. This bootcamp is designed for complete beginners. If your child is curious, they're ready.",
  },
  {
    q: "Is this safe and supervised?",
    a: "Absolutely. All sessions are conducted with trained instructors, and all AI tools used are appropriate for the age group. We've carefully reviewed everything your child will interact with.",
  },
  {
    q: "What age group is this best suited for?",
    a: "We welcome kids from 8 to 16. Younger children (8–11) focus on creative, fun AI activities. Older students (12–16) take on more complex projects and independent work.",
  },
  {
    q: "Will my child get a certificate?",
    a: "Yes — every student who completes the bootcamp receives a Tech Windows AI Bootcamp certificate, plus a showcase of the project they built.",
  },
  {
    q: "What if my child misses a session?",
    a: "We understand things come up. Reach out to us and we'll work with you to arrange a make-up session or catch-up material.",
  },
  {
    q: "How many kids are in each batch?",
    a: "We keep batches small to ensure every child gets personal attention from the instructor. Batch sizes are limited — enrol early to secure your spot.",
  },
  {
    q: "Is there a free trial or demo session available?",
    a: "Yes! We periodically run free intro sessions so your child can experience the bootcamp before committing. Chat with us on WhatsApp to find the next one.",
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