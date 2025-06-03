"use client";

import { Facebook, Instagram, Youtube, AtSign, Twitter, Linkedin, Mail, Phone, MapPin, Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface FooterData {
  companyInfo: {
    name: string;
    description?: string;
    logo?: { url: string };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };
  socialMedia: Array<{
    platform: string;
    url: string;
    isActive: boolean;
  }>;
  navigationSections: Array<{
    sectionTitle: string;
    links: Array<{
      title: string;
      url: string;
      isActive: boolean;
      order: number;
    }>;
    isActive: boolean;
    order: number;
  }>;
  newsletter: {
    title: string;
    description: string;
    buttonText: string;
    isActive: boolean;
  };
  copyright: {
    text: string;
    showYear: boolean;
  };
  localization: {
    language: string;
    country: string;
    currency: string;
    showLanguage: boolean;
    showCurrency: boolean;
  };
  settings: {
    showSecurePayments: boolean;
    securePaymentsText: string;
    backgroundColor: string;
    textColor: string;
    isActive: boolean;
  };
}

const getSocialIcon = (platform: string) => {
  const iconMap: { [key: string]: any } = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Twitter,
    linkedin: Linkedin,
  };
  return iconMap[platform] || AtSign;
};

export default function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await fetch('/api/footer');
        const data = await response.json();
        
        if (data.success) {
          setFooterData(data.footer);
        }
      } catch (error) {
        console.error('Error fetching footer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  if (loading) {
    return (
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-4 h-4 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          <p className="mt-4 text-gray-300 animate-pulse">Loading footer...</p>
        </div>
      </footer>
    );
  }

  if (!footerData || !footerData.settings.isActive) {
    return null;
  }

  const formatAddress = (address: any) => {
    if (!address) return "";
    return [address.street, address.city, address.state, address.zipCode, address.country]
      .filter(Boolean)
      .join(", ");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <footer 
      className="relative overflow-hidden section-fade-in"
      style={{ 
        backgroundColor: footerData.settings.backgroundColor || '#1c1c1c',
        color: footerData.settings.textColor || '#ffffff'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
        </div>
      </div>

      <div className="relative z-10 py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Enhanced Company Info Section */}
            <div className="lg:col-span-2 space-y-6 section-slide-up">
              <div className="group">
                {footerData.companyInfo.logo?.url ? (
                  <Image
                    src={footerData.companyInfo.logo.url}
                    alt={footerData.companyInfo.name}
                    width={200}
                    height={80}
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    {footerData.companyInfo.name}
                  </h2>
                )}
              </div>
              
              {footerData.companyInfo.description && (
                <p className="text-gray-300 leading-relaxed text-sm">
                  {footerData.companyInfo.description}
                </p>
              )}
              
              {/* Enhanced Contact Info */}
              <div className="space-y-3">
                {footerData.companyInfo.address && (
                  <div className="flex items-start gap-3 text-sm text-gray-300 hover:text-white transition-colors group">
                    <MapPin className="w-4 h-4 mt-1 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span>{formatAddress(footerData.companyInfo.address)}</span>
                  </div>
                )}
                
                {footerData.companyInfo.contact?.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group">
                    <Mail className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                    <a href={`mailto:${footerData.companyInfo.contact.email}`} className="hover:text-orange-400 transition-colors">
                      {footerData.companyInfo.contact.email}
                    </a>
                  </div>
                )}
                
                {footerData.companyInfo.contact?.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group">
                    <Phone className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                    <a href={`tel:${footerData.companyInfo.contact.phone}`} className="hover:text-orange-400 transition-colors">
                      {footerData.companyInfo.contact.phone}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Enhanced Social Media Icons */}
              {footerData.socialMedia.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Follow Us</h4>
                  <div className="flex space-x-4">
                    {footerData.socialMedia
                      .filter(social => social.isActive)
                      .map((social, index) => {
                        const IconComponent = getSocialIcon(social.platform);
                        return (
                          <Link 
                            key={index} 
                            href={social.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                              <IconComponent size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Navigation Sections */}
            {footerData.navigationSections
              .filter(section => section.isActive)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((section, index) => (
                <div key={index} className="section-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <h3 className="text-lg font-bold mb-6 text-white relative">
                    {section.sectionTitle}
                    <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                  </h3>
                  <ul className="space-y-3">
                    {section.links
                      .filter(link => link.isActive)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <Link 
                            href={link.url} 
                            className="text-sm text-gray-300 hover:text-orange-400 transition-all duration-300 hover:translate-x-1 inline-block group"
                          >
                            <span className="relative">
                              {link.title}
                              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}

            {/* Enhanced Newsletter Section */}
            {footerData.newsletter.isActive && (
              <div className="space-y-6 section-slide-up">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                  <h3 className="text-lg font-bold text-white">{footerData.newsletter.title}</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {footerData.newsletter.description}
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <div className="relative group">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300"
                      required
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 group"
                  >
                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    {footerData.newsletter.buttonText}
                  </Button>
                </form>
                {footerData.settings.showSecurePayments && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-green-400">
                      {footerData.settings.securePaymentsText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Footer Bottom */}
          <div 
            className="pt-8 border-t border-white/10"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-300">{footerData.copyright.text}</p>
              </div>
              
              {(footerData.localization.showLanguage || footerData.localization.showCurrency) && (
                <div className="flex items-center gap-6 text-sm">
                  {footerData.localization.showLanguage && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>Language:</span>
                      <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded">
                        {footerData.localization.country} | {footerData.localization.language}
                      </span>
                    </div>
                  )}
                  {footerData.localization.showCurrency && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span>Currency:</span>
                      <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded">
                        {footerData.localization.currency}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
