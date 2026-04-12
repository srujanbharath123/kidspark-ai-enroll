import { Sparkles, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919876543210";
const WHATSAPP_MSG = encodeURIComponent("Hi! I'd like to know more about the Tech Windows AI Bootcamp.");

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Tech Windows</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed max-w-sm">
              We built Tech Windows because we believe every kid deserves a head start in the world they're growing up in. AI is already here — this bootcamp teaches kids how to use it.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#curriculum" className="hover:text-background transition-colors">Curriculum</a></li>
              <li><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="hover:text-background transition-colors">Testimonials</a></li>
              <li><a href="#faq" className="hover:text-background transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@tech-windows.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Mumbai, India</li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-background transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 text-center text-sm text-background/40">
          © {new Date().getFullYear()} Tech Windows AI Bootcamp. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;