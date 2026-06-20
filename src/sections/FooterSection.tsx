import { Shield, Mail, Instagram, MessageCircle } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A22]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Main footer content */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#00D4AA]" />
              <span className="font-heading text-2xl tracking-wider">AIRSHIELD</span>
            </div>
            <p className="text-sm text-[#8A8A93] leading-relaxed">
              A premium full-face anti-pollution motorcycle helmet for Indonesia.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider text-[#8A8A93]">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#product" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  AirShield One
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#filter" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  Filter Subscription
                </a>
              </li>
              <li>
                <a href="#science" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  Science & Sources
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider text-[#8A8A93]">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#beta" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  Beta Program
                </a>
              </li>
              <li>
                <a href="#" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  About (coming soon)
                </a>
              </li>
              <li>
                <a href="#" className="text-[#8A8A93] hover:text-[#00D4AA] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wider text-[#8A8A93]">Connect</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-[#8A8A93] hover:text-[#00D4AA] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@airshield.id
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-[#8A8A93] hover:text-[#00D4AA] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  @airshield.id
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-[#8A8A93] hover:text-[#00D4AA] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp (coming soon)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1A1A22]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8A8A93]">
              © 2026 AirShield. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#8A8A93]">
              <a href="#" className="hover:text-[#F4F1EC] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#F4F1EC] transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
