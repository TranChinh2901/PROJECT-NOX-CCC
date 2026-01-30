'use client';

import React from 'react';
import { Instagram, Twitter, Linkedin, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  const footerLinks = {
    products: [
      { label: 'Laptop', href: '#' },
      { label: 'Điện Thoại', href: '#' },
      { label: 'Máy Tính Để Bàn', href: '#' },
      { label: 'Phụ Kiện', href: '#' },
    ],
    company: [
      { label: 'Về Chúng Tôi', href: '#' },
      { label: 'Tuyển Dụng', href: '#' },
      { label: 'Báo Chí', href: '#' },
      { label: 'Nhà Đầu Tư', href: '#' },
    ],
    support: [
      { label: 'Liên Hệ', href: '#' },
      { label: 'Câu Hỏi Thường Gặp', href: '#' },
      { label: 'Vận Chuyển', href: '#' },
      { label: 'Đổi Trả', href: '#' },
    ],
    legal: [
      { label: 'Chính Sách Bảo Mật', href: '#' },
      { label: 'Điều Khoản', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#B47B04] flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-gray-900 font-heading font-bold text-xl">
                TechNova
              </span>
            </a>
            <p className="text-gray-600 text-sm mb-6 max-w-xs">
              Công nghệ tinh xảo cho những người đòi hỏi sự xuất sắc. 
              Tương lai của đổi mới, giao đến tận nhà bạn.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 transition-all duration-300 hover:bg-[#CA8A04] hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 font-heading font-semibold mb-4">Sản Phẩm</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-600 text-sm transition-colors duration-300 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-heading font-semibold mb-4">Công Ty</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-600 text-sm transition-colors duration-300 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-heading font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-600 text-sm transition-colors duration-300 hover:text-gray-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-heading font-semibold mb-4">Liên Hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@technova.vn</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600 text-sm">
                <Phone className="w-4 h-4" />
                <span>1900 888 888</span>
              </li>
              <li className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Nguyễn Huệ<br />Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © 2026 TechNova. Bảo lưu mọi quyền.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 text-sm transition-colors duration-300 hover:text-gray-900"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
