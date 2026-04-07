import { Sparkles, Mail, Phone, MapPin } from "lucide-react";

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
              <span className="font-display text-xl font-bold">TechWindows</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed max-w-sm">
              Empowering the next generation with AI skills. Fun, creative, and hands-on learning for kids aged 8–16.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#courses" className="hover:text-background transition-colors">Courses</a></li>
              <li><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="hover:text-background transition-colors">Testimonials</a></li>
              <li><a href="#faq" className="hover:text-background transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@techwindows.ai</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Mumbai, India</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 text-center text-sm text-background/40">
          © {new Date().getFullYear()} TechWindows AI Bootcamp. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
