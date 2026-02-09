"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import StoreBrand from "@/components/storefront/StoreBrand";
import StoreLogo from "@/components/storefront/StoreLogo";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <Link href={`/`} className="flex items-center gap-2">
                            <StoreLogo size={40} roundedClassName="rounded-xl" fallbackText="F" />
                            <span className="font-heading font-extrabold text-2xl tracking-tight text-white">
                                <StoreBrand fallback="FabricMarket" />
                            </span>
                        </Link>
                        <p className="text-secondary-foreground/70 text-sm leading-relaxed">
                            En kaliteli kumaşları, en uygun fiyatlarla kapınıza getiriyoruz.
                            Modayı kumaşından takip edin.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                                <Instagram className="w-5 h-5 text-white" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                                <Facebook className="w-5 h-5 text-white" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
                                <Twitter className="w-5 h-5 text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Kurumsal</h4>
                        <ul className="space-y-4 text-sm text-secondary-foreground/70">
                            <li><Link href={`/hakkimizda`} className="hover:text-primary transition-colors">Hakkımızda</Link></li>
                            <li><Link href={`/iletisim`} className="hover:text-primary transition-colors">İletişim</Link></li>
                            <li><Link href={`/magazalar`} className="hover:text-primary transition-colors">Mağazalarımız</Link></li>
                            <li><Link href={`/blog`} className="hover:text-primary transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">Müşteri Hizmetleri</h4>
                        <ul className="space-y-4 text-sm text-secondary-foreground/70">
                            <li><Link href={`/sikca-sorulan-sorular`} className="hover:text-primary transition-colors">S.S.S.</Link></li>
                            <li><Link href={`/teslimat-ve-iade`} className="hover:text-primary transition-colors">Teslimat ve İade</Link></li>
                            <li><Link href={`/gizlilik-politikasi`} className="hover:text-primary transition-colors">Gizlilik Politikası</Link></li>
                            <li><Link href={`/mesafeli-satis-sozlesmesi`} className="hover:text-primary transition-colors">Satış Sözleşmesi</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-heading font-bold text-white mb-6 uppercase tracking-wider text-sm">İletişim Bilgileri</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-secondary-foreground/70">Tekstilkent Cad. No:123, Esenler, İstanbul</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary shrink-0" />
                                <a href="tel:+902120000000" className="text-secondary-foreground/70 hover:text-primary">0 (212) 000 00 00</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary shrink-0" />
                                <a href="mailto:destek@fabricmarket.co" className="text-secondary-foreground/70 hover:text-primary">destek@fabricmarket.co</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-secondary-foreground/50">
                    <p>© {currentYear} FabricMarket. Tüm Hakları Saklıdır.</p>
                    <div className="flex gap-6">
                        <span>BK Bilgi Teknolojileri</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
