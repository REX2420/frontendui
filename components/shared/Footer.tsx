"use client";

import { Facebook, Instagram, Youtube, AtSign, Twitter, Linkedin } from "lucide-react";
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
      <footer className="bg-[#1c1c1c] text-white py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">Loading...</div>
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

  return (
    <footer 
      className="py-12 px-4 md:px-6 lg:px-8"
      style={{ 
        backgroundColor: footerData.settings.backgroundColor,
        color: footerData.settings.textColor 
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Company Info Section */}
        <div className="space-y-4">
          {footerData.companyInfo.logo?.url ? (
            <Image
              src={footerData.companyInfo.logo.url}
              alt={footerData.companyInfo.name}
              width={200}
              height={80}
              className="object-contain"
            />
          ) : (
            <h2 className="text-2xl font-bold">{footerData.companyInfo.name}</h2>
          )}
          
          {footerData.companyInfo.description && (
            <p className="text-sm">{footerData.companyInfo.description}</p>
          )}
          
          {footerData.companyInfo.address && (
            <p className="text-sm">{formatAddress(footerData.companyInfo.address)}</p>
          )}
          
          {footerData.companyInfo.contact?.email && (
            <p className="text-sm">{footerData.companyInfo.contact.email}</p>
          )}
          
          {footerData.companyInfo.contact?.phone && (
            <p className="text-sm">{footerData.companyInfo.contact.phone}</p>
          )}
          
          {/* Social Media Icons */}
          {footerData.socialMedia.length > 0 && (
            <div className="flex space-x-4">
              {footerData.socialMedia
                .filter(social => social.isActive)
                .map((social, index) => {
                  const IconComponent = getSocialIcon(social.platform);
                  return (
                    <Link key={index} href={social.url} target="_blank" rel="noopener noreferrer">
                      <IconComponent size={20} className="hover:opacity-75 transition-opacity" />
                    </Link>
                  );
                })}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        {footerData.navigationSections
          .filter(section => section.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.sectionTitle}</h3>
              <ul className="space-y-2 text-sm">
                {section.links
                  .filter(link => link.isActive)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.url} className="hover:opacity-75 transition-opacity">
                        {link.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

        {/* Newsletter Section */}
        {footerData.newsletter.isActive && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{footerData.newsletter.title}</h3>
            <p className="text-sm">{footerData.newsletter.description}</p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Email Address"
                className="rounded-r-none"
                style={{ 
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />
              <Button
                type="submit"
                className="rounded-l-none"
                style={{
                  backgroundColor: 'white',
                  color: 'black'
                }}
              >
                {footerData.newsletter.buttonText}
              </Button>
            </div>
            {footerData.settings.showSecurePayments && (
              <p className="text-sm font-semibold">{footerData.settings.securePaymentsText}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer Bottom */}
      <div 
        className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm"
        style={{ borderColor: `${footerData.settings.textColor}33` }}
      >
        <p>{footerData.copyright.text}</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          {footerData.localization.showLanguage && (
            <>
              <span>Language</span>
              <span className="font-semibold">
                {footerData.localization.country} | {footerData.localization.language}
              </span>
            </>
          )}
          {footerData.localization.showCurrency && (
            <>
              <span>Currency</span>
              <span className="font-semibold">{footerData.localization.currency}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
